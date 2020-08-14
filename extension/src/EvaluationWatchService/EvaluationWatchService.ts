import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import { DataExtractionState, CompletionItem } from "../webviewContract";

export interface EvaluationWatchService {
	createEvaluationWatcher(
		expression: string,
		options: EvaluationWatcherOptions
	): EvaluationWatcher;

	getCompletions(text: string, column: number): Promise<CompletionItem[]>;

	/**
	 * The language the expressions must be written in.
	 * `undefined`, if unknown.
	 * This field is observable.
	 */
	readonly languageId: string | undefined;
}

export interface EvaluationWatcherOptions {
	preferredDataExtractor?: DataExtractorId | undefined;
}

export interface EvaluationWatcher {
	readonly expression: string;
	/** This field is observable */
	readonly state: DataExtractionState;
	/** This field is observable */
	readonly preferredDataExtractor: DataExtractorId | undefined;

	setPreferredDataExtractor(id: DataExtractorId | undefined): void;
	refresh(): void;
	dispose(): void;
}
