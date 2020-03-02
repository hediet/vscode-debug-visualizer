import {
	DataExtractionResult,
	DataExtractorId,
} from "@hediet/debug-visualizer-data-extraction";
import { VsCodeDebugSession } from "../../VsCodeDebugger";

export interface DataExtractionProviderFactory {
	createDataExtractionProvider(
		session: VsCodeDebugSession
	): DataExtractionProvider | undefined;
}

export interface DataExtractionProvider {
	evaluate(
		args: DataExtractionProviderArgs
	): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: string }
	>;
}

export interface DataExtractionProviderArgs {
	expression: string;
	preferredExtractorId: DataExtractorId | undefined;
	frameId: number | undefined;
}
