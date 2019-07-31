import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import { DataExtractionState } from "@hediet/debug-visualizer-vscode-shared";

export interface DataSource {
	createEvaluationWatcher(expression: string): EvaluationWatcher;
}

export interface EvaluationWatcher {
	readonly expression: string;

	// is observable
	readonly preferredDataExtractor: DataExtractorId | undefined;

	setPreferredDataExtractor(id: DataExtractorId): void;

	refresh(): void;

	// is observable
	state: DataExtractionState;

	dispose(): void;
}
