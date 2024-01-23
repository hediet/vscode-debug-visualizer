import {
	getExpressionForDataExtractorApi,
	DataResult,
	ApiHasNotBeenInitializedCode,
	getExpressionToInitializeDataExtractorApi,
	DataExtractionResult,
} from "@hediet/debug-visualizer-data-extraction";
import { EnhancedDebugSession } from "../../debugger/EnhancedDebugSession";
import {
	EvaluationEngine,
	Evaluator,
	EvaluationArgs,
} from "./EvaluationEngine";
import { FormattedMessage } from "../../webviewContract";
import { registerUpdateReconciler, hotClass } from "@hediet/node-reload";

registerUpdateReconciler(module);

@hotClass(module)
export class PyEvaluationEngine implements EvaluationEngine {
	createEvaluator(session: EnhancedDebugSession): Evaluator | undefined {
		const supportedDebugAdapters = [
			"python",

		];
		if (supportedDebugAdapters.indexOf(session.session.type) !== -1) {
			return new PyEvaluator(session);
		}
		return undefined;
	}
}

class PyEvaluator implements Evaluator {
	public readonly languageId = "python";

	constructor(private readonly session: EnhancedDebugSession) { }

	private getContext(): "copy" | "repl" {
		if (this.session.session.type.startsWith("pwa-")) {
			return "copy";
		}
		return "repl";
	}

	public async evaluate({
		expression,
		preferredExtractorId,
		frameId,
	}: EvaluationArgs): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
	> {
		while (true) {
			try {
				const preferredExtractorExpr = preferredExtractorId
					? `"${preferredExtractorId}"`
					: "undefined";

				const body = `${getExpressionForDataExtractorApi()}.getData(
                    e => (${expression}),
                    expr => eval(expr),
                    ${preferredExtractorExpr}
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

				const reply = await this.session.evaluate({
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
				const msg = error.message as string | undefined;
				if (msg && msg.includes(ApiHasNotBeenInitializedCode)) {
					if (await this.initializeApi(frameId)) {
						continue;
					}
				}

				return {
					kind: "error",
					message: error.message,
				};
			}
		}
	}

	private async initializeApi(frameId: number | undefined): Promise<boolean> {
		try {
			// prefer existing is true, so that manually registered (possibly newer) extractors are not overwritten.
			const expression = `${getExpressionToInitializeDataExtractorApi()}.registerDefaultExtractors(true);`;

			await this.session.evaluate({
				expression,
				frameId,
				context: this.getContext(),
			});

			return true;
		} catch (error) {
			return false;
		}
	}
}
