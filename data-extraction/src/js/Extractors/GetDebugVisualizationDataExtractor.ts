import { ExtractedData } from "../../DataExtractionResult";
import { DataExtractor, ExtractionCollector } from "..";

export class GetDebugVisualizationDataExtractor
	implements DataExtractor<ExtractedData> {
	readonly id = "get-debug-visualization";
	getExtractions(
		data: unknown,
		extractionCollector: ExtractionCollector<ExtractedData>,
		evalFn: <TEval>(expression: string) => TEval
	): void {
		if (
			typeof data === "object" &&
			data &&
			"getDebugVisualization" in data
		) {
			extractionCollector.addExtraction({
				id: this.id,
				name: "getDebugVisualization",
				priority: 500,
				extractData() {
					return (data as any).getDebugVisualization();
				},
			});
		}
	}
}
