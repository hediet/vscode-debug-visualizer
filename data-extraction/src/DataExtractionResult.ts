export interface DataExtractionResult {
	data: VisualizationData;
	usedExtractor: DataExtractorInfo;
	availableExtractors: DataExtractorInfo[];
}

/**
 * Instances must be valid json values.
 */
export interface VisualizationData {
	kind: Record<string, true>;
}

export interface DataExtractorInfo {
	id: DataExtractorId;
	name: string;
	priority: number;
}

export type DataExtractorId = {
	__brand: "DataExtractorId";
} & string;

export function isVisualizationData(val: unknown): val is VisualizationData {
	if (typeof val !== "object" || !val || !("kind" in val)) {
		return false;
	}

	const obj = val as any;
	if (typeof obj.kind !== "object" || !obj.kind) {
		return false;
	}

	return Object.values(obj.kind).every(val => val === true);
}
