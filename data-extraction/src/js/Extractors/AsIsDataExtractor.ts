import { ExtractedData } from "../../DataExtractionResult";
import { DataExtractor, ExtractionCollector } from "..";

export class AsIsDataExtractor implements DataExtractor<ExtractedData> {
	readonly id = "as-is";
	getExtractions(
		data: unknown,
		extractionCollector: ExtractionCollector<ExtractedData>,
		evalFn: <TEval>(expression: string) => TEval
	): void {
		if (typeof data !== "object" || !data || !("kind" in data)) {
			return;
		}

		const obj = data as any;
		if (typeof obj.kind !== "object" || !obj.kind) {
			return;
		}

		const areAllTrue = Object.values(obj.kind).every(val => val === true);
		if (!areAllTrue) {
			return;
		}

		extractionCollector.addExtraction({
			id: this.id,
			name: "As Is",
			priority: 500,
			extractData() {
				return obj;
			},
		});
	}
}
