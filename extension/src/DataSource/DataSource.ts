import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import {
	DataExtractionState,
	CompletionItem,
} from "@hediet/debug-visualizer-vscode-shared";

export interface EvaluationWatcherOptions {
	preferredDataExtractor?: DataExtractorId | undefined;
}

export interface DataSource {
	createEvaluationWatcher(
		expression: string,
		options: EvaluationWatcherOptions
	): EvaluationWatcher;
	getCompletions(text: string, column: number): Promise<CompletionItem[]>;
}

export interface EvaluationWatcher {
	readonly expression: string;

	// is observable
	readonly preferredDataExtractor: DataExtractorId | undefined;

	setPreferredDataExtractor(id: DataExtractorId | undefined): void;

	refresh(): void;

	// is observable
	state: DataExtractionState;

	dispose(): void;
}
