import {
	DataExtractionResult,
	DataExtractorId,
} from "@hediet/debug-visualizer-data-extraction";
import { EnhancedDebugSession } from "../../debugger/EnhancedDebugSession";
import { FormattedMessage } from "../../webviewContract";

export interface EvaluationEngine {
	createEvaluator(session: EnhancedDebugSession): Evaluator | undefined;
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
