import { ExtractedData } from "../../DataExtractionResult";
import {
	ExtractionCollector,
	DataExtractor,
	DataExtractorContext,
} from "../DataExtractor";

export class GetDebugVisualizationDataExtractor
	implements DataExtractor<ExtractedData> {
	readonly id = "get-debug-visualization";
	getExtractions(
		data: unknown,
		collector: ExtractionCollector<ExtractedData>,
		context: DataExtractorContext
	): void {
		if (
			typeof data !== "object" ||
			!data ||
			!("getDebugVisualization" in data)
		) {
			return;
		}

		collector.addExtraction({
			id: this.id,
			name: "Use Method 'getDebugVisualization'",
			priority: 600,
			extractData() {
				return (data as any).getDebugVisualization();
			},
		});
	}
}
