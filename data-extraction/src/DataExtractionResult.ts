export type DataExtractionResult = {
	data: ExtractedData;
	usedExtractor: DataExtractorInfo;
	availableExtractors: DataExtractorInfo[];
};

// is json
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
};
