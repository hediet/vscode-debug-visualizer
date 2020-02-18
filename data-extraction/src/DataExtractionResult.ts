export type DataExtractionResult = {
	data: ExtractedData;
	usedExtractor: DataExtractorInfo;
	availableExtractors: DataExtractorInfo[];
};

/**
 * Instances must be valid json values.
 */
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

export function isExtractedData(val: unknown): val is ExtractedData {
	if (typeof val !== "object" || !val || !("kind" in val)) {
		return false;
	}

	const obj = val as any;
	if (typeof obj.kind !== "object" || !obj.kind) {
		return false;
	}

	return Object.values(obj.kind).every(val => val === true);
}
