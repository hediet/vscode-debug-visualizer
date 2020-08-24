import { isAssertionExpression } from "typescript";
import { DataExtractor, ExtractionCollector, DataExtractorContext } from "..";
import { TableVisualizationData } from "../../../CommonDataTypes";
import { expect } from "../../../util";

function assert<T>(value: unknown): asserts value {}

export class TableDataExtractor implements DataExtractor {
	readonly id = "table";

	getExtractions(
		data: unknown,
		collector: ExtractionCollector,
		context: DataExtractorContext
	): void {
		if (!Array.isArray(data)) {
			return;
		}
		if (!data.every(d => typeof d === "object" && d)) {
			return;
		}
		assert<object[]>(data);

		collector.addExtraction({
			id: "table",
			name: "Table",
			priority: 1000,
			extractData() {
				return expect<TableVisualizationData>({
					kind: {
						table: true,
					},
					rows: data,
				});
			},
		});

		collector.addExtraction({
			id: "table-with-type-name",
			name: "Table (With Type Name)",
			priority: 950,
			extractData() {
				return expect<TableVisualizationData>({
					kind: {
						table: true,
					},
					rows: data.map(d => ({ type: d.constructor.name, ...d })),
				});
			},
		});
	}
}
