import {
	getExpressionForDataExtractorApi,
	DataResult,
	ApiHasNotBeenInitializedCode,
	getExpressionToInitializeDataExtractorApi,
	DataExtractionResult,
} from "@hediet/debug-visualizer-data-extraction";
import { VsCodeDebugSession } from "../../VsCodeDebugger";
import {
	DataExtractionProviderFactory,
	DataExtractionProvider,
	DataExtractionProviderArgs,
} from "./DataExtractionProvider";
import { FormattedMessage } from "../../contract";
import { registerUpdateReconciler, hotClass } from "@hediet/node-reload";

registerUpdateReconciler(module);

@hotClass(module)
export class JsDataExtractionProviderFactory
	implements DataExtractionProviderFactory {
	createDataExtractionProvider(
		session: VsCodeDebugSession
	): DataExtractionProvider | undefined {
		const supportedDebugAdapters = [
			"node",
			"node2",
			"extensionHost",
			"chrome",
		];
		if (supportedDebugAdapters.indexOf(session.session.type) !== -1) {
			return new JsDataEvaluator(session);
		}
		return undefined;
	}
}

class JsDataEvaluator implements DataExtractionProvider {
	constructor(private readonly session: VsCodeDebugSession) {}

	public async evaluate({
		expression,
		preferredExtractorId,
		frameId,
	}: DataExtractionProviderArgs): Promise<
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
				});
				const resultStr = reply.result;
				const jsonData = resultStr.substr(1, resultStr.length - 2);
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
			});

			return true;
		} catch (error) {
			return false;
		}
	}
}
