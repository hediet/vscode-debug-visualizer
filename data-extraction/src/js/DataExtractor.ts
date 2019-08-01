import { ExtractedData } from "../DataExtractionResult";

export interface DataExtractor<T extends ExtractedData> {
	id: string;
	getExtractions(
		data: unknown,
		extractionCollector: ExtractionCollector<T>,
		evalFn: <TEval>(expression: string) => TEval
	): void;
}

export interface ExtractionCollector<T extends ExtractedData> {
	addExtraction(extraction: DataExtraction<T>): void;
}

export interface DataExtraction<TData extends ExtractedData> {
	// the higher the better
	priority: number;
	id: string;
	name: string;
	extractData(): TData;
}

export function getExtractions<T extends ExtractedData>(
	extractor: DataExtractor<T>,
	data: unknown,
	evalFn: <T>(expression: string) => T
): DataExtraction<T>[] {
	const extractions = new Array<DataExtraction<T>>();
	const collector: ExtractionCollector<T> = {
		addExtraction(extraction) {
			extractions.push(extraction);
		},
	};
	extractor.getExtractions(data, collector, evalFn);
	return extractions;
}
