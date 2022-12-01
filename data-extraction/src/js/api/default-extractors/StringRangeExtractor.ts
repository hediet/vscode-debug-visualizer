import { DataExtractor, ExtractionCollector, DataExtractorContext } from "..";
import { LineColumnRange } from "../../../CommonDataTypes";
import { asData } from "../../helpers";

export class StringRangeExtractor implements DataExtractor {
	readonly id = "stringRange";
	getExtractions(
		data: unknown,
		collector: ExtractionCollector,
		context: DataExtractorContext
	): void {
		if (!Array.isArray(data)) {
			return;
		}
		if (typeof data[0] !== "string") {
			return;
		}

		const text = data[0];

		const decorations1: { range: LineColumnRange; label?: string }[] = [];
		const decorations2: { range: LineColumnRange; label?: string }[] = [];

		function offsetToLineColumn(offset: number) {
			let line = 0;
			let column = 0;
			for (let idx = 0; idx < text.length; idx++) {
				if (idx === offset) {
					return { line, column };
				}
				if (text[idx] === "\n") {
					line++;
					column = 0;
				} else {
					column++;
				}
			}
			return { line, column }; // TODO
		}

		if (
			data.length === 2 &&
			typeof data[1] === "object" &&
			!Array.isArray(data[1])
		) {
			data = [data[0], ...Object.values(data[1])] as [
				number | [number, number]
			][];
		}

		for (let item of (data as (number | [number, number])[]).slice(1)) {
			if (typeof item === "string") {
				item = context.evalFn(item);
				if (item === undefined) {
					continue;
				}
			}

			if (typeof item === "number") {
				const pos = offsetToLineColumn(item);
				decorations1.push({ range: { start: pos, end: pos } });
				decorations2.push({
					range: {
						start: pos,
						end: { line: pos.line, column: pos.column + 1 },
					},
				});
			} else if (
				Array.isArray(item) &&
				item.length === 2 &&
				typeof item[0] === "number" &&
				typeof item[1] === "number"
			) {
				decorations1.push({
					range: {
						start: offsetToLineColumn(item[0]),
						end: offsetToLineColumn(item[1]),
					},
				});
				decorations2.push(decorations1[decorations1.length - 1]);
			} else {
				return;
			}
		}

		collector.addExtraction({
			priority: 1200,
			id: "stringRange",
			name: "String Range",
			extractData() {
				return asData({
					kind: { text: true },
					text,
					decorations: decorations1,
				});
			},
		});

		collector.addExtraction({
			priority: 1000,
			id: "stringRangeFullCharacters",
			name: "String Range (Full Character)",
			extractData() {
				return asData({
					kind: { text: true },
					text,
					decorations: decorations2,
				});
			},
		});
	}
}
