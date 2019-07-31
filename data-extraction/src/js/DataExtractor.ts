import { ExtractedData } from "../DataExtractionResult";

export interface DataExtractor<T extends ExtractedData> {
	id: string;
	getExtractions(
		data: any,
		extractionCollector: ExtractionCollector<T>
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
