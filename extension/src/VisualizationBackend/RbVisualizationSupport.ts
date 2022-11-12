import { DataExtractionResult, DataResult } from "@hediet/debug-visualizer-data-extraction";
import { hotClass, registerUpdateReconciler } from "@hediet/node-reload";
import { Config } from "../Config";
import { DebuggerViewProxy } from "../proxies/DebuggerViewProxy";
import { DebugSessionProxy } from "../proxies/DebugSessionProxy";
import { FormattedMessage } from "../webviewContract";
import { DebugSessionVisualizationSupport, GetVisualizationDataArgs, VisualizationBackend, VisualizationBackendBase } from "./VisualizationBackend";

registerUpdateReconciler(module);

@hotClass(module)
export class RbEvaluationEngine implements DebugSessionVisualizationSupport {
	constructor(
		private readonly debuggerView: DebuggerViewProxy,
		private readonly config: Config
	) { }

	createBackend(
		session: DebugSessionProxy
	): VisualizationBackend | undefined {
		const supportedDebugAdapters = ['rdbg'];

		if (supportedDebugAdapters.indexOf(session.session.type) !== -1) {
			return new RbVisualizationBackend(
				session,
				this.debuggerView,
				this.config
			);
		}
		return undefined;
	}
}

class RbVisualizationBackend extends VisualizationBackendBase {
	public readonly expressionLanguageId = 'ruby';
	constructor(
		debugSession: DebugSessionProxy,
		debuggerView: DebuggerViewProxy,
		private readonly config: Config
	) {
		super(debugSession, debuggerView)
	}

	private readonly defaultContext = "repl";

	public async getVisualizationData(
		args: GetVisualizationDataArgs
	): Promise<
		| { kind: "data"; result: DataExtractionResult; }
		| { kind: "error"; message: FormattedMessage; }
	> {
		const result = await this._getVisualizationData(args);
		return result;
	}

	private async _getVisualizationData({
		expression,
		preferredExtractorId
	}: GetVisualizationDataArgs): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
	> {
		try {
			if (expression.length === 0) throw new Error("No extractors");

			const frameId = this.debuggerView.getActiveStackFrameId(
				this.debugSession
			);
			const initialReply = await this.debugSession.evaluate({
				expression: "require 'debugvisualizer'",
				frameId,
				context: this.defaultContext
			});
			if (initialReply.result.includes('LoadError')) {
				return {
					kind: "error",
					message: {
						kind: "list",
						items: [
							"LoadError: Failed to load debugvisualizer.",
							{
								kind: "inlineList",
								items: [
									"Install the gem by executing:",
									{ kind: "code", content: "$ bundle add debugvisualizer" },
								],
							},
							{
								kind: "inlineList",
								items: [
									"If bundler is not being used, install the gem by executing:",
									{ kind: "code", content: "$ gem install debugvisualizer" },
								],
							}
						],
					}
				};
			}
			const preferredId = preferredExtractorId || '';
			const wrappedExpr = `
				DebugVisualizer.to_debug_visualizer_protocol_json("${preferredId}", ${expression})
			`;
			const reply = await this.debugSession.evaluate({
				expression: wrappedExpr,
				frameId,
				context: this.defaultContext
			})

			let dataResult: DataResult;
			try {
				// Debuggee converts result to a JSON string twice.
				dataResult = JSON.parse(JSON.parse(reply.result)) as DataResult;
			} catch (error) {
				let message = error.message
				// The `reply.result` is as follows when error occurs in the evaluation of an expression and parsing will fail.
				// e.g. "#<ZeroDivisionError: divided by 0>"
				// In this case, it is more beneficial to display this error message.
				if (reply.result.includes('Error')) message = reply.result;
				throw new Error(message)
			}

			switch (dataResult.kind) {
				case 'NoExtractors':
					throw new Error("No extractors");
				case 'Error':
					throw new Error(dataResult.message);
				case 'Data':
					return {
						kind: "data",
						result: dataResult.extractionResult,
					};
				default:
					throw new Error("Invalid Data");
			}
		} catch (error) {
			return {
				kind: "error",
				message: error.message
			};
		}
	}
}
