import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../..";
import { GridVisualizationData } from "../../../CommonDataTypes";
import { expect } from "../../../util";

export class GridExtractor implements DataExtractor {
	readonly id = "grid";
	getExtractions(
		data: unknown,
		extractionCollector: ExtractionCollector,
		context: DataExtractorContext
	): void {
		if (!Array.isArray(data)) {
			return;
		}

		extractionCollector.addExtraction({
			id: this.id,
			name: "Array As Grid",
			priority: 500,
			extractData: () =>
				expect<GridVisualizationData>({
					kind: { grid: true },
					rows: [{ columns: data.map(d => ({ tag: "" + d })) }],
				}),
		});
	}
}
