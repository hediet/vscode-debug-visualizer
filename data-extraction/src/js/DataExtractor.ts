import { ExtractedData } from "../DataExtractionResult";

export interface DataExtractor<T extends ExtractedData> {
	/**
	 * Must be unique among all data extractors.
	 */
	id: string;
	getExtractions(
		data: unknown,
		extractionCollector: ExtractionCollector<T>,
		context: DataExtractorContext
	): void;
}

export interface ExtractionCollector<T extends ExtractedData> {
	/**
	 * Suggests a possible extraction.
	 */
	addExtraction(extraction: DataExtraction<T>): void;
}

export interface DataExtractorContext {
	/**
	 * Evaluates an expression in the context of the active stack frame.
	 */
	evalFn: <TEval>(expression: string) => TEval;
}

export interface DataExtraction<TData extends ExtractedData> {
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
	extractData(): TData;
}

export function getExtractions<T extends ExtractedData>(
	extractor: DataExtractor<T>,
	data: unknown,
	context: DataExtractorContext
): DataExtraction<T>[] {
	const extractions = new Array<DataExtraction<T>>();
	const collector: ExtractionCollector<T> = {
		addExtraction(extraction) {
			extractions.push(extraction);
		},
	};
	extractor.getExtractions(data, collector, context);
	return extractions;
}
