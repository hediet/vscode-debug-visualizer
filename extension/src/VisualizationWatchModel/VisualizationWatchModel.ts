import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import { CompletionItem, DataExtractionState } from "../webviewContract";

export interface VisualizationWatchModel {
	createWatch(
		expression: string,
		options: VisualizationWatchOptions
	): VisualizationWatch;

	getCompletions(text: string, column: number): Promise<CompletionItem[]>;

	/**
	 * The language the expressions must be written in.
	 * `undefined`, if unknown.
	 * This field is observable.
	 */
	readonly languageId: string | undefined;
}

export interface VisualizationWatchOptions {
	preferredDataExtractor?: DataExtractorId | undefined;
	sessionState?: unknown;
}

export interface VisualizationWatch {
	/** This field is constant. */
	readonly expression: string;

	/** This field is observable */
	readonly state: DataExtractionState;

	/** This field is observable */
	readonly preferredDataExtractor: DataExtractorId | undefined;

	readonly sessionState: unknown;

	setPreferredDataExtractor(id: DataExtractorId | undefined): void;
	refresh(): void;
	dispose(): void;
}
