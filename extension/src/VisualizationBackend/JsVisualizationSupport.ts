import {
	DataExtractionResult,
	DataResult,
	getExpressionForDataExtractorApi,
	getExpressionToInitializeDataExtractorApi,
	ApiHasNotBeenInitializedCode,
} from "@hediet/debug-visualizer-data-extraction";
import { hotClass, registerUpdateReconciler } from "@hediet/node-reload";
import { existsSync, readFileSync, watch } from "fs";
import { observable, reaction } from "mobx";
import { window, workspace } from "vscode";
import { Config } from "../Config";
import { DebuggerViewProxy } from "../proxies/DebuggerViewProxy";
import { DebugSessionProxy } from "../proxies/DebugSessionProxy";
import { FormattedMessage } from "../webviewContract";
import {
	DebugSessionVisualizationSupport,
	GetVisualizationDataArgs,
	VisualizationBackend,
	VisualizationBackendBase,
} from "./VisualizationBackend";
import { Disposable } from "@hediet/std/disposable";
import { DebouncedRunner } from "../utils/DebouncedRunner";
import { FileWatcher } from "../webview/WebviewConnection";

registerUpdateReconciler(module);

@hotClass(module)
export class JsEvaluationEngine implements DebugSessionVisualizationSupport {
	constructor(
		private readonly debuggerView: DebuggerViewProxy,
		private readonly config: Config
	) {}

	createBackend(
		session: DebugSessionProxy
	): VisualizationBackend | undefined {
		const supportedDebugAdapters = [
			"node",
			"node2",
			"extensionHost",
			"chrome",
			"pwa-chrome",
			"pwa-node",
			"pwa-extensionHost",
			"node-terminal",
			"pwa-msedge",
		];

		if (supportedDebugAdapters.indexOf(session.session.type) !== -1) {
			return new JsVisualizationBackend(
				session,
				this.debuggerView,
				this.config
			);
		}
		return undefined;
	}
}

class JsVisualizationBackend extends VisualizationBackendBase {
	public readonly expressionLanguageId = "javascript";
	private initializePromise: Promise<void> | undefined = undefined;

	constructor(
		debugSession: DebugSessionProxy,
		debuggerView: DebuggerViewProxy,
		private readonly config: Config
	) {
		super(debugSession, debuggerView);
	}

	private getContext(): "copy" | "repl" {
		if (this.debugSession.session.type.startsWith("pwa-")) {
			return "copy";
		}
		return "repl";
	}

	public async getVisualizationData(
		args: GetVisualizationDataArgs
	): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
	> {
		const result = await this._getVisualizationData(args);

		if (result.kind === "not-initialized") {
			await this.initializeApiSafe();

			const result2 = await this._getVisualizationData(args);

			if (result2.kind !== "not-initialized") {
				return result2;
			} else {
				return {
					kind: "error",
					message: "Could not initialize API",
				};
			}
		}

		return result;
	}

	private async _getVisualizationData({
		expression,
		preferredExtractorId,
	}: GetVisualizationDataArgs): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
		| { kind: "not-initialized" }
	> {
		try {
			const frameId = this.debuggerView.getActiveStackFrameId(
				this.debugSession
			);

			const variableNames = new Array<string>();
			if (frameId) {
				const scopes = await this.debugSession.getScopes({ frameId });
				const scopeVariables = await Promise.all(
					scopes
						.filter((s) => !s.expensive && s.name !== "Global")
						.map((s) =>
							this.debugSession.getVariables({
								variablesReference: s.variablesReference,
							})
						)
				);
				for (const variables of scopeVariables) {
					variableNames.push(
						...variables
							.filter((v) => v.value !== "undefined")
							.map((v) => v.name)
					);
				}

				if (variableNames.length > 50) {
					variableNames.length = 50;
				}
			}

			const preferredExtractorExpr = preferredExtractorId
				? `"${preferredExtractorId}"`
				: "undefined";

			const body = `${getExpressionForDataExtractorApi()}.getData(
                    e => (${expression}),
                    expr => eval(expr),
                    ${preferredExtractorExpr},
					{${variableNames.map((n) => `${n}: () => ${n}`).join(",")}},
                )`;

			const wrappedExpr = `
				(() => {
					try {
						return ${body};
					} catch (e) {
						return JSON.stringify({
							kind: "Error",
							message: e.message,
							stack: e.stack
						});
					}
				})()
			`;

			const reply = await this.debugSession.evaluate({
				expression: wrappedExpr,
				frameId,
				context: this.getContext(),
			});
			const resultStr = reply.result;
			const jsonData =
				this.getContext() === "copy"
					? resultStr
					: resultStr.substr(1, resultStr.length - 2);
			const result = JSON.parse(jsonData) as DataResult;

			if (result.kind === "NoExtractors") {
				throw new Error("No extractors");
			} else if (result.kind === "Error") {
				throw new Error(result.message);
			} else if (result.kind === "Data") {
				return {
					kind: "data",
					result: result.extractionResult,
				};
			} else {
				throw new Error("Invalid Data");
			}
		} catch (error) {
			if (
				typeof error.message === "string" &&
				error.message.indexOf(ApiHasNotBeenInitializedCode) !== -1
			) {
				return {
					kind: "not-initialized",
				};
			}

			return {
				kind: "error",
				message: error.message,
			};
		}
	}

	private initializeApiSafe(): Promise<void> {
		if (!this.initializePromise) {
			this.initializePromise = this.initializeApi().finally(
				() => (this.initializePromise = undefined)
			);
		}
		return this.initializePromise;
	}

	private async initializeApi(): Promise<void> {
		// prefer existing is true, so that manually registered (possibly newer) extractors are not overwritten.
		const expression = `${getExpressionToInitializeDataExtractorApi()}.registerDefaultExtractors(true);`;

		await this.debugSession.evaluate({
			expression,
			frameId: undefined,
			context: this.getContext(),
		});

		await this.initializeCustomScripts();
	}

	private customScripts: undefined | CustomScripts;

	private async initializeCustomScripts(): Promise<void> {
		this.dispose.untrack(this.customScripts);
		this.customScripts?.dispose();
		this.customScripts = this.dispose.track(
			new CustomScripts(this.debugSession, this.config, () =>
				this.onChangeEmitter.emit()
			)
		);
	}
}

class CustomScripts {
	public readonly dispose = Disposable.fn();

	constructor(
		debugSession: DebugSessionProxy,
		config: Config,
		changeHandler: () => void
	) {
		this.dispose.track(
			new FileWatcher(
				() => config.customScriptPaths,
				async (files) => {
					for (const file of files) {
						if (!file.fileExists) {
							window.showErrorMessage(
								`The file ${file.path} does not exist.`
							);
							continue;
						}

						let expression = `
						(
							runCode => {
								let fn = undefined;
								if (runCode) {
									const module = {};
									runCode(module);
									fn = module.exports;
								}
								${getExpressionForDataExtractorApi()}.setDataExtractorFn(
									${JSON.stringify(file.path)},
									fn
								);
							}
						)
						(
							${
								file.content === undefined
									? "undefined"
									: `function (module) { ${file.content} }`
							}
						)`;

						try {
							await debugSession.evaluate({
								expression,
								frameId: undefined,
								context: "repl",
							});
						} catch (e) {
							window.showErrorMessage(
								'Error while running custom visualization extractor script "' +
									file.path +
									'": ' +
									e.message
							);
						}
					}

					changeHandler();
				}
			)
		);
	}
}
