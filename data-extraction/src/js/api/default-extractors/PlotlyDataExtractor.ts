import { ExtractedData } from "../../../DataExtractionResult";
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../DataExtractorApi";
import { CommonDataTypes } from "../../../CommonDataTypes";

export class PlotDataExtractor implements DataExtractor<ExtractedData> {
	readonly id = "plot";

	getExtractions(
		data: unknown,
		collector: ExtractionCollector<ExtractedData>,
		context: DataExtractorContext
	): void {
		if (!Array.isArray(data)) {
			return;
		}
		if (data.some(x => typeof x !== "number")) {
			return;
		}

		collector.addExtraction({
			id: "plot-y",
			name: "Plot as y-Values",
			priority: 1001,
			extractData() {
				return {
					kind: {
						plotly: true,
					},
					data: [{ y: data }],
				} as CommonDataTypes.Plotly;
			},
		});
	}
}
