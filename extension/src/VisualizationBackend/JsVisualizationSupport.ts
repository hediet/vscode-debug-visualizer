import {
	ApiHasNotBeenInitializedCode,
	CallFrameRequest,
	CallFramesRequest,
	DataExtractionResult,
	DataExtractorId,
	DataResult,
	getExpressionForDataExtractorApi,
	getExpressionToInitializeDataExtractorApi,
} from "@hediet/debug-visualizer-data-extraction";
import { hotClass, registerUpdateReconciler } from "@hediet/node-reload";
import { Disposable } from "@hediet/std/disposable";
import { window } from "vscode";
import { Config } from "../Config";
import { DebugSessionProxy, StackFrame, StackTraceInfo } from "../proxies/DebugSessionProxy";
import { DebuggerViewProxy } from "../proxies/DebuggerViewProxy";
import { FileWatcher } from "../webview/WebviewConnection";
import { FormattedMessage } from "../webviewContract";
import {
	DebugSessionVisualizationSupport,
	GetVisualizationDataArgs,
	VisualizationBackend,
	VisualizationBackendBase,
} from "./VisualizationBackend";

registerUpdateReconciler(module);

@hotClass(module)
export class JsEvaluationEngine implements DebugSessionVisualizationSupport {
	constructor(private readonly debuggerView: DebuggerViewProxy, private readonly config: Config) {}

	createBackend(session: DebugSessionProxy): VisualizationBackend | undefined {
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
			return new JsVisualizationBackend(session, this.debuggerView, this.config);
		}
		return undefined;
	}
}

class CallFrameState {
	public request: CallFramesRequest | undefined = undefined;
}

class JsVisualizationBackend extends VisualizationBackendBase {
	public readonly expressionLanguageId = "javascript";
	private initializePromise: Promise<void> | undefined = undefined;

	constructor(debugSession: DebugSessionProxy, debuggerView: DebuggerViewProxy, private readonly config: Config) {
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
	): Promise<{ kind: "data"; result: DataExtractionResult } | { kind: "error"; message: FormattedMessage }> {
		let result = await this.getVisualizationDataIfInitialized(args);

		if (result.kind === "not-initialized") {
			await this.initializeApiOrWait();
			result = await this.getVisualizationDataIfInitialized(args);
			if (result.kind === "not-initialized") {
				return {
					kind: "error",
					message: "Could not initialize API",
				};
			}
		}

		return result;
	}

	private async getVisualizationDataIfInitialized(
		args: GetVisualizationDataArgs
	): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
		| { kind: "not-initialized" }
	> {
		const { expression, preferredExtractorId } = args;
		let callFrameState: CallFrameState;
		if (args.sessionStore.data instanceof CallFrameState) {
			callFrameState = args.sessionStore.data;
		} else {
			callFrameState = new CallFrameState();
			args.sessionStore.data = callFrameState;
		}

		try {
			const frameId = this.debuggerView.getActiveStackFrameId(this.debugSession);

			const stackTrace = await this.debuggerView.activeDebugSession!.getStackTrace({
				threadId: 0,
				levels: 20,
			});

			const variableNames = await getVariableNames(this.debugSession, frameId);

			let tryCount = 0;
			while (true) {
				tryCount++;

				let callFrameDataValue = "null";
				if (callFrameState.request) {
					callFrameDataValue = await getCallFramesSnapshotValue(
						this.debugSession,
						stackTrace,
						callFrameState.request
					);
				}
				const result = await this.evaluateVisualizationDataRequest(
					expression,
					preferredExtractorId,
					variableNames,
					callFrameDataValue,
					frameId
				);

				if (result.kind === "NoExtractors") {
					throw new Error("No extractors");
				} else if (result.kind === "Error") {
					throw new Error(result.message + "\n" + (result as any).stack);
				} else if (result.kind === "Data") {
					return {
						kind: "data",
						result: result.extractionResult,
					};
				} else if (result.kind === "OutdatedCallFrameSnapshot") {
					if (tryCount >= 2) {
						throw new Error("OutdatedCallFrameSnapshot");
					}
					callFrameState.request = result.callFramesRequest;
				} else {
					throw new Error("Invalid Data");
				}
			}
		} catch (error: any) {
			if (typeof error.message === "string" && error.message.indexOf(ApiHasNotBeenInitializedCode) !== -1) {
				return { kind: "not-initialized" };
			}
			return {
				kind: "error",
				message: error.message,
			};
		}
	}

	private async evaluateVisualizationDataRequest(
		expression: string,
		preferredExtractorId: DataExtractorId | undefined,
		variableNames: string[],
		callFrameDataValue: string,
		frameId: number | undefined
	): Promise<DataResult> {
		const preferredExtractorExpr = preferredExtractorId ? `"${preferredExtractorId}"` : "undefined";
		const body = `${getExpressionForDataExtractorApi()}.getData(
				() => (${expression}),
				expr => eval(expr),
				${preferredExtractorExpr},
				{${variableNames.map((n) => `${n}: () => ${n}`).join(",")}},
				${callFrameDataValue}
			)`;

		const wrappedExpr = `(() => {
	try { return ${body}; }
	catch (e) { return JSON.stringify({ kind: "Error", message: e.message, stack: e.stack }); }
})()
	`;

		const reply = await this.debugSession.evaluate({
			expression: wrappedExpr,
			frameId,
			context: this.getContext(),
		});
		const resultStr = reply.result;
		const jsonData = this.getContext() === "copy" ? resultStr : resultStr.substr(1, resultStr.length - 2);
		const result = JSON.parse(jsonData) as DataResult;
		return result;
	}

	private initializeApiOrWait(): Promise<void> {
		if (!this.initializePromise) {
			this.initializePromise = this.initializeApi().finally(() => (this.initializePromise = undefined));
		}
		return this.initializePromise;
	}

	private async initializeApi(): Promise<void> {
		// prefer existing is true, so that manually registered (possibly newer) extractors are not overwritten.
		const expression = `${getExpressionToInitializeDataExtractorApi()}.registerDefaultExtractors(true);`;
		const frameId = this.debuggerView.getActiveStackFrameId(this.debugSession);
		const result = await this.debugSession.evaluate({
			expression,
			frameId,
			context: this.getContext(),
		});

		await this.initializeCustomScripts();
	}

	private customScripts: undefined | CustomScripts;

	private async initializeCustomScripts(): Promise<void> {
		this.dispose.untrack(this.customScripts);
		this.customScripts?.dispose();
		this.customScripts = this.dispose.track(
			new CustomScripts(this.debugSession, this.debuggerView, this.config, () => this.onChangeEmitter.emit())
		);
	}
}

let globalCallFrameId = 0;

async function getCallFramesSnapshotValue(
	debugSession: DebugSessionProxy,
	stackTrace: StackTraceInfo,
	callFramesRequest: CallFramesRequest
): Promise<string> {
	const globalFnDef = `
function getGlobal() {
	if (typeof globalThis === "object") {
		return globalThis;
	} else if (typeof global === "object") {
		return global;
	} else if (typeof window === "object") {
		return window;
	}
	throw new Error("No global available");
}`;

	const callFrameId = globalCallFrameId++;
	let idx = 0;
	let skippedCount = 0;
	const skippedCounts: Record<number, number> = {};

	let frames = stackTrace.stackFrames;
	const firstAsyncFrameIdx = frames.findIndex((f) => f.id === 0);
	if (firstAsyncFrameIdx !== -1) {
		frames = frames.slice(0, firstAsyncFrameIdx);
	}

	const result = await Promise.all(
		frames.map(async (frame) => {
			function matches(frame: StackFrame, callFrameRequest: CallFrameRequest): boolean {
				if (frame.name !== callFrameRequest.methodName) {
					return false;
				}
				return true;
			}

			if (!callFramesRequest.requestedCallFrames.some((r) => matches(frame, r))) {
				if (skippedCount === 0) {
					idx++;
				}
				skippedCount++;
				skippedCounts[idx - 1] = skippedCount;
				return undefined;
			}
			skippedCount = 0;
			const curFrameIdx = idx;
			idx++;

			const scopes = await debugSession.getScopes({ frameId: frame.id });
			const scopeVariables = await Promise.all(
				scopes
					.filter((s) => !s.expensive && s.name.indexOf(":") !== -1)
					.map((s) => debugSession.getVariables({ variablesReference: s.variablesReference }))
			);
			const variables = new Set(scopeVariables.flatMap((v) => v.map((v) => v.name)));

			await debugSession.evaluate({
				expression: `
(() => {
	${globalFnDef}
	const g = getGlobal();
	(g.$$hedietDbgVslzr${callFrameId} = g.$$hedietDbgVslzr${callFrameId} || [])[${curFrameIdx}] = {
		vars: { ${[...variables].map((v) => `${v}: ${v}`).join(", ")} },
		...${JSON.stringify({
			methodName: frame.name,
			source: { path: frame.source.path, name: frame.source.name },
		})}
	};
})();
`,
				frameId: frame.id,
				context: "repl",
			});

			return true;
		})
	);

	if (!result.some((r) => r)) {
		return `{ requestId: ${JSON.stringify(callFramesRequest.requestId)}, frames: [] }`;
	}

	return `
(() => {
	${globalFnDef}
	const g = getGlobal();
	const r = g.$$hedietDbgVslzr${callFrameId};
	delete g.$$hedietDbgVslzr${callFrameId};
	${Object.entries(skippedCounts)
		.map(([idx, val]) => `r[${idx}] = { skippedFrames: ${val} };\n`)
		.join("")}
	return { requestId: ${JSON.stringify(callFramesRequest.requestId)}, frames: r };
})()
`;
}

async function getVariableNames(debugSession: DebugSessionProxy, frameId: number | undefined) {
	const variableNames = new Array<string>();
	if (frameId) {
		const scopes = await debugSession.getScopes({ frameId });
		const scopeVariables = await Promise.all(
			scopes
				.filter((s) => !s.expensive && s.name !== "Global")
				.map((s) =>
					debugSession.getVariables({
						variablesReference: s.variablesReference,
					})
				)
		);
		for (const variables of scopeVariables) {
			variableNames.push(...variables.filter((v) => v.value !== "undefined").map((v) => v.name));
		}

		if (variableNames.length > 50) {
			variableNames.length = 50;
		}
	}
	return variableNames;
}

class CustomScripts {
	public readonly dispose = Disposable.fn();

	constructor(
		debugSession: DebugSessionProxy,
		debuggerView: DebuggerViewProxy,
		config: Config,
		changeHandler: () => void
	) {
		this.dispose.track(
			new FileWatcher(
				() => config.customScriptPaths,
				async (files) => {
					for (const file of files) {
						if (!file.fileExists) {
							window.showErrorMessage(`The file ${file.path} does not exist.`);
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
							${file.content === undefined ? "undefined" : `function (module) { ${file.content} }`}
						)`;

						try {
							await debugSession.evaluate({
								expression,
								frameId: debuggerView.getActiveStackFrameId(debugSession),
								context: "repl",
							});
						} catch (e: any) {
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
