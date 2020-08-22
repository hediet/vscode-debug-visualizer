import { VisualizationData } from "../../../DataExtractionResult";
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../DataExtractorApi";

export class GetVisualizationDataExtractor implements DataExtractor {
	readonly id = "get-visualization-data";
	getExtractions(
		data: unknown,
		collector: ExtractionCollector,
		context: DataExtractorContext
	): void {
		if (typeof data !== "object" || !data) {
			return;
		}

		const getVisualizationData = (data as any)
			.getVisualizationData as Function;
		if (typeof getVisualizationData !== "function") {
			return;
		}

		collector.addExtraction({
			id: this.id,
			name: "Use Method 'getVisualizationData'",
			priority: 600,
			extractData() {
				return getVisualizationData.apply(data);
			},
		});
	}
}
