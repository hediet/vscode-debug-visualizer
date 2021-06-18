import {
	getExpressionForDataExtractorApi,
	DataResult,
	getExpressionToInitializeDataExtractorApi,
	DataExtractionResult,
	getExpressionToDetectDataExtractorApiPresence,
} from "@hediet/debug-visualizer-data-extraction";
import { DebugSessionProxy } from "../proxies/DebugSessionProxy";
import {
	DebugSessionVisualizationSupport,
	VisualizationBackend,
	GetVisualizationDataArgs,
	VisualizationBackendBase,
} from "./VisualizationBackend";
import { FormattedMessage } from "../webviewContract";
import { registerUpdateReconciler, hotClass } from "@hediet/node-reload";
import { Config } from "../Config";
import { DebuggerViewProxy } from "../proxies/DebuggerViewProxy";
import { readFileSync, existsSync } from "fs";
import { reaction, observable } from "mobx";
import {
	workspace,
	FileSystemWatcher,
	CancellationTokenSource,
	CancellationToken,
	window,
} from "vscode";
import { ResettableTimeout } from "@hediet/std/timer";

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
	private apiInitialized = false;
	private initializedPromise: Promise<void> | undefined = undefined;

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

	public async getVisualizationData({
		expression,
		preferredExtractorId,
	}: GetVisualizationDataArgs): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
	> {
		try {
			await this.ensureRuntimeIsInjected();

			const frameId = this.debuggerView.getActiveStackFrameId(
				this.debugSession
			);

			const variableNames = new Array<string>();
			if (frameId) {
				const scopes = await this.debugSession.getScopes({ frameId });
				const scopeVariables = await Promise.all(
					scopes
						.filter(s => !s.expensive)
						.map(s =>
							this.debugSession.getVariables({
								variablesReference: s.variablesReference,
							})
						)
				);
				for (const variables of scopeVariables) {
					variableNames.push(
						...variables
							.filter(v => v.value !== "undefined")
							.map(v => v.name)
					);
				}

				if (variableNames.length > 100) {
					variableNames.length = 100;
				}
			}

			const preferredExtractorExpr = preferredExtractorId
				? `"${preferredExtractorId}"`
				: "undefined";

			const body = `${getExpressionForDataExtractorApi()}.getData(
                    e => (${expression}),
                    expr => eval(expr),
                    ${preferredExtractorExpr},
					{${variableNames.map(n => `${n}: ${n}`).join(",")}},
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
			return {
				kind: "error",
				message: error.message,
			};
		}
	}

	private ensureRuntimeIsInjected(): Promise<void> | undefined {
		if (this.apiInitialized) {
			return;
		}

		if (this.initializedPromise) {
			return this.initializedPromise;
		} else {
			this.initializedPromise = this._ensureRuntimeIsInjected();
		}
	}

	private async _ensureRuntimeIsInjected(): Promise<void> {
		const body = getExpressionToDetectDataExtractorApiPresence();

		const reply = await this.debugSession.evaluate({
			expression: body,
			frameId: undefined,
			context: this.getContext(),
		});
		const isApiInitialized = reply.result === "true";

		if (!isApiInitialized) {
			await this.initializeApi();
		}

		await this.initializeCustomScripts();
	}

	private async initializeApi(): Promise<boolean> {
		try {
			// prefer existing is true, so that manually registered (possibly newer) extractors are not overwritten.
			const expression = `${getExpressionToInitializeDataExtractorApi()}.registerDefaultExtractors(true);`;

			await this.debugSession.evaluate({
				expression,
				frameId: undefined,
				context: this.getContext(),
			});

			return true;
		} catch (error) {
			return false;
		}
	}

	@observable
	private filesVersionId: number = 0;

	private readonly fileChangeDebouncedScheduler = new DebouncedScheduler(100);

	private async initializeCustomScripts(): Promise<void> {
		await this.debugSession.evaluate({
			expression: `global["${injectedScriptsKey}"] = {};`,
			frameId: undefined,
			context: "repl",
		});

		const watchers = new Map<string, WatchedFile>();
		this.dispose.track({
			dispose: () => {
				for (const w of watchers.values()) {
					w.watcher.dispose();
				}
			},
		});

		reaction(
			() => ({
				customScriptPaths: [...this.config.customScriptPaths],
				version: this.filesVersionId,
			}),
			async ({ customScriptPaths }) => {
				const promises = new Array<Promise<[Result, WatchedFile]>>();

				const activePaths = new Set<string>();
				for (const fsPath of customScriptPaths) {
					activePaths.add(fsPath);
					let entry = watchers.get(fsPath);
					if (!entry) {
						entry = new WatchedFile(fsPath, this.debugSession);
						watchers.set(fsPath, entry);
						entry.watcher.onDidChange(() => {
							this.fileChangeDebouncedScheduler.run(() => {
								this.filesVersionId++;
							});
						});
					}

					promises.push(entry.update().then(e => [e, entry!]));
				}

				for (const [fsPath, entry] of watchers) {
					if (!activePaths.has(fsPath)) {
						promises.push(entry.remove().then(e => [e, entry]));
						entry.watcher.dispose();
						watchers.delete(fsPath);
					}
				}

				const results = await Promise.all(promises);
				const errors = results.filter(([r]) => r.error);
				for (const [e, watcher] of errors) {
					window.showErrorMessage(
						`Error while evaluating "${watcher.fsPath}": ${
							e.error!.message
						}`
					);
				}

				if (promises.length > 0) {
					this.onChangeEmitter.emit();
				}
			},
			{
				fireImmediately: true,
			}
		);
	}
}

const injectedScriptsKey = `@hediet/debug-visualizer/injectedScripts`;

interface Result {
	error?: { message: string };
}

class WatchedFile {
	public static nextId = 0;
	public readonly watcher = workspace.createFileSystemWatcher(this.fsPath);
	public readonly id = WatchedFile.nextId++;
	public lastContent: string | undefined = undefined;

	constructor(
		public readonly fsPath: string,
		private readonly debugSession: DebugSessionProxy
	) {}

	public async update(): Promise<Result> {
		if (!existsSync(this.fsPath)) {
			return {
				error: { message: `File does not exist.` },
			};
		}

		const scriptContent = readFileSync(this.fsPath, {
			encoding: "utf-8",
		});

		if (this.lastContent === scriptContent) {
			return {};
		}
		this.lastContent = scriptContent;

		const expression = `
			(
				load => {
					var module = {};
					load(module);
					global["${injectedScriptsKey}"]["${this.id}"] = module.exports;
				}
			)
			(
				function (module) { ${scriptContent} }
			)`;
		try {
			await this.debugSession.evaluate({
				expression,
				frameId: undefined,
				context: "repl",
			});
		} catch (e) {
			return { error: { message: e.message } };
		}

		return {};
	}

	public async remove(): Promise<Result> {
		const expression = `(() => { delete global["${injectedScriptsKey}"]["${this.id}"]; })()`;
		try {
			await this.debugSession.evaluate({
				expression,
				frameId: undefined,
				context: "repl",
			});
		} catch (e) {
			return { error: { message: e.message } };
		}

		return {};
	}
}

class DebouncedScheduler {
	private timeout: NodeJS.Timeout | undefined;

	constructor(private readonly debounceTimeout: number) {}

	public run(action: () => void): void {
		this.clear();
		this.timeout = setTimeout(action, this.debounceTimeout);
	}

	private clear() {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
	}

	public dispose(): void {
		this.clear();
	}
}
