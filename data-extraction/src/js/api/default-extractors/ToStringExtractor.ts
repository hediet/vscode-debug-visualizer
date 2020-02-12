import { ExtractedData } from "../../../DataExtractionResult";
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../DataExtractorApi";

export class ToStringDataExtractor implements DataExtractor<ExtractedData> {
	readonly id = "to-string";

	getExtractions(
		data: unknown,
		collector: ExtractionCollector<ExtractedData>,
		context: DataExtractorContext
	): void {
		collector.addExtraction({
			id: "to-string",
			name: "To String",
			priority: 100,
			extractData() {
				return {
					kind: {
						text: true,
					},
					text: "" + data,
				};
			},
		});
	}
}
