import { ExtractedData } from "../../../DataExtractionResult";
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../..";
import { CommonDataTypes } from "../../../CommonDataTypes";

export class GridExtractor implements DataExtractor<ExtractedData> {
	readonly id = "grid";
	getExtractions(
		data: unknown,
		extractionCollector: ExtractionCollector<ExtractedData>,
		context: DataExtractorContext
	): void {
		if (!Array.isArray(data)) {
			return;
		}

		extractionCollector.addExtraction({
			id: this.id,
			name: "Array As Grid",
			priority: 500,
			extractData(): CommonDataTypes.Grid {
				return {
					kind: { array: true },
					rows: [{ columns: data.map(d => ({ tag: d })) }],
				};
			},
		});
	}
}
