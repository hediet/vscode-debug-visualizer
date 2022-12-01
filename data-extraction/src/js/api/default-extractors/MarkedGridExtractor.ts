import { DataExtractor, ExtractionCollector, DataExtractorContext } from "..";
import { LineColumnRange } from "../../../CommonDataTypes";
import { asData, markedGrid, tryEval } from "../../helpers";

export class MarkedGridFromArrayExtractor implements DataExtractor {
	readonly id = "markedGridFromArray";
	getExtractions(
		data: unknown,
		collector: ExtractionCollector,
		context: DataExtractorContext
	): void {
		if (!Array.isArray(data)) {
			return;
		}
		if (!Array.isArray(data[0])) {
			return;
		}

		let markers: any;
		if (data.length === 2 && typeof data[1] === "object") {
			markers = data[1];
		} else {
			for (let i = 1; i < data.length; i++) {
				if (typeof data[i] !== "string") {
					return;
				}
			}
			markers = tryEval(data.slice(1));
		}

		collector.addExtraction({
			id: "markedGridFromArray",
			name: "Marked Grid from Array",
			priority: 1000,
			extractData() {
				return markedGrid(data[0], markers as any);
			},
		});
	}
}
