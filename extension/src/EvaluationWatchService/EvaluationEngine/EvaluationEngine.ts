import {
	DataExtractionResult,
	DataExtractorId,
} from "@hediet/debug-visualizer-data-extraction";
import { VsCodeDebugSession } from "../../VsCodeDebugger";
import { FormattedMessage } from "../../contract";

export interface EvaluationEngine {
	createEvaluator(session: VsCodeDebugSession): Evaluator | undefined;
}

export interface Evaluator {
	evaluate(
		args: EvaluationArgs
	): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
	>;
}

export interface EvaluationArgs {
	expression: string;
	preferredExtractorId: DataExtractorId | undefined;
	frameId: number | undefined;
}
