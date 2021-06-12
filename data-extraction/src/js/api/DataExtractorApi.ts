import {
	VisualizationData,
	DataExtractionResult,
} from "../../DataExtractionResult";

export interface DataExtractorApi {
	/**
	 * Registers a single extractor.
	 */
	registerExtractor(extractor: DataExtractor): void;

	/**
	 * Registers multiple extractors.
	 */
	registerExtractors(extractors: DataExtractor[]): void;

	/**
	 * Extracts data from the result of `valueFn`.
	 * @valueFn a function returning the value to extract the data from.
	 * Is a function so that it's evaluation can depend on `evalFn`.
	 */
	getData(
		valueFn: () => unknown,
		evalFn: <T>(expression: string) => T,
		preferredDataExtractorId: string | undefined,
		variablesInScope: Record<string, unknown>
	): JSONString<DataResult>;

	/**
	 * Registers all default (built-in) extractors.
	 * @preferExisting if `true`, existing extractors with the same id are not overwritten.
	 */
	registerDefaultExtractors(preferExisting?: boolean): void;
}

export type DataResult =
	| {
			kind: "Data";
			extractionResult: DataExtractionResult;
	  }
	| { kind: "NoExtractors" }
	| { kind: "Error"; message: string };

export interface JSONString<T> extends String {
	__brand: { json: T };
}

export interface DataExtractor {
	/**
	 * Must be unique among all data extractors.
	 */
	id: string;
	getExtractions(
		data: unknown,
		extractionCollector: ExtractionCollector,
		context: DataExtractorContext
	): void;
}

export interface ExtractionCollector {
	/**
	 * Suggests a possible extraction.
	 */
	addExtraction(extraction: DataExtraction): void;
}

export interface DataExtractorContext {
	/**
	 * Evaluates an expression in the context of the active stack frame.
	 */
	evalFn: <TEval>(expression: string) => TEval;

	variablesInScope: Record<string, unknown>;
}

export interface DataExtraction {
	/**
	 * Higher priorities are preferred.
	 */
	priority: number;

	/**
	 * A unique id identifying this extraction among all extractions.
	 * Required to express extraction preferences.
	 */
	id: string;
	/**
	 * A user friendly name of this extraction.
	 */
	name: string;
	extractData(): VisualizationData;
}
