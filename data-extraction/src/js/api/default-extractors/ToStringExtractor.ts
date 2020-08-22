import { MonacoTextVisualizationData } from "../../../CommonDataTypes";
import { expect } from "../../../util";
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../DataExtractorApi";

export class ToStringDataExtractor implements DataExtractor {
	readonly id = "to-string";

	getExtractions(
		data: unknown,
		collector: ExtractionCollector,
		context: DataExtractorContext
	): void {
		collector.addExtraction({
			id: "to-string",
			name: "To String",
			priority: 100,
			extractData() {
				return expect<MonacoTextVisualizationData>({
					kind: {
						text: true,
					},
					text: "" + data,
				});
			},
		});
	}
}
