import { PlotlyVisualizationData } from "../../../CommonDataTypes";
import { expect } from "../../../util";
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../DataExtractorApi";

export class PlotlyDataExtractor implements DataExtractor {
	readonly id = "plot";

	getExtractions(
		data: unknown,
		collector: ExtractionCollector,
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
			extractData: () =>
				expect<PlotlyVisualizationData>({
					kind: {
						plotly: true,
					},
					data: [{ y: data }],
				}),
		});
	}
}
