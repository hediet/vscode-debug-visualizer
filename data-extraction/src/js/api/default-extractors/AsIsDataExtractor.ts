import { ExtractedData, isExtractedData } from "../../../DataExtractionResult";
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../..";

export class AsIsDataExtractor implements DataExtractor<ExtractedData> {
	readonly id = "as-is";
	getExtractions(
		data: unknown,
		extractionCollector: ExtractionCollector<ExtractedData>,
		context: DataExtractorContext
	): void {
		if (!isExtractedData(data)) {
			return;
		}

		extractionCollector.addExtraction({
			id: this.id,
			name: "As Is",
			priority: 500,
			extractData() {
				return data;
			},
		});
	}
}
