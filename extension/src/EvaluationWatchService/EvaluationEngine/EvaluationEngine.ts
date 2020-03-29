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

	/**
	 * The language that expressions must be written in.
	 */
	readonly languageId: string | undefined;
}

export interface EvaluationArgs {
	expression: string;
	preferredExtractorId: DataExtractorId | undefined;
	frameId: number | undefined;
}
