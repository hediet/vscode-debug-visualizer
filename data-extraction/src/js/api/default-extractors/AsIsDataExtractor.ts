import { isVisualizationData } from "../../../DataExtractionResult";
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../..";

export class AsIsDataExtractor implements DataExtractor {
	readonly id = "as-is";
	getExtractions(
		data: unknown,
		extractionCollector: ExtractionCollector,
		context: DataExtractorContext
	): void {
		if (!isVisualizationData(data)) {
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
