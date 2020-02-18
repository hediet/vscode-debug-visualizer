import {
	DataResult,
	DataExtractionResult,
	ExtractedData,
	isExtractedData,
} from "@hediet/debug-visualizer-data-extraction";
import { VsCodeDebugSession } from "../../VsCodeDebugger";
import {
	DataExtractionProviderFactory,
	DataExtractionProvider,
	DataExtractionProviderArgs,
} from "./DataExtractionProvider";

export class GenericDataExtractionProviderFactory
	implements DataExtractionProviderFactory {
	createDataExtractionProvider(
		session: VsCodeDebugSession
	): DataExtractionProvider | undefined {
		return new GenericDataExtractionProvider(session);
	}
}

class GenericDataExtractionProvider implements DataExtractionProvider {
	constructor(private readonly session: VsCodeDebugSession) {}

	public async evaluate({
		expression,
		preferredExtractor,
		frameId,
	}: DataExtractionProviderArgs): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: string }
	> {
		try {
			const reply = await this.session.evaluate({
				expression,
				frameId,
			});
			const resultStr = reply.result;
			const jsonData = resultStr.substr(1, resultStr.length - 2);
			const result = JSON.parse(jsonData) as ExtractedData;

			if (!isExtractedData(result)) {
				throw new Error("Invalid Data");
			}

			return {
				kind: "data",
				result: {
					availableExtractors: [],
					usedExtractor: {
						id: "generic" as any,
						name: "Generic",
						priority: 1,
					},
					data: result,
				},
			};
		} catch (error) {
			return {
				kind: "error",
				message: error.message,
			};
		}
	}
}
