export type DataExtractionResult = {
	data: ExtractedData;
	usedExtractor: DataExtractorInfo;
	availableExtractors: DataExtractorInfo[];
};

// Instances must be valid json values.
export type ExtractedData = {
	kind: Record<string, true>;
};

export type DataExtractorInfo = {
	id: DataExtractorId;
	name: string;
	priority: number;
};

export type DataExtractorId = {
	__brand: "DataExtractorId";
} & string;
