import { VisualizationData } from "../../../DataExtractionResult";
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../DataExtractorApi";
import {
	createGraph,
	CreateGraphEdge,
	createGraphFromPointers,
} from "../../helpers";
import { GraphNode } from "../../..";

export class ObjectGraphExtractor implements DataExtractor {
	readonly id = "object-graph";

	getExtractions(
		data: unknown,
		collector: ExtractionCollector,
		context: DataExtractorContext
	): void {
		function isObject(val: unknown): val is object {
			if (typeof val !== "object") {
				return false;
			}
			if (!val) {
				return false;
			}
			return true;
		}
		if (!isObject(data)) {
			return;
		}

		const infoSelector: (item: object) => {
			id?: string | number;
			edges: CreateGraphEdge<object>[];
		} & Omit<GraphNode, "id"> = (item) => {
			let label = "";
			const edges = new Array<CreateGraphEdge<any>>();
			if (item instanceof Set) {
				label = "Set";
				for (const value of item.values()) {
					if (isObject(value)) {
						edges.push({ label: "item", to: value });
					}
				}
			} else if (item instanceof Map) {
				label = "Map";
				for (const [key, value] of item.entries()) {
					if (isObject(value)) {
						edges.push({ label: key, to: value });
					}
				}
			} else {
				for (const [key, val] of Object.entries(item)) {
					if (isObject(val)) {
						edges.push({ label: key, to: val });
					}
				}

				const className = item.constructor
					? item.constructor.name
					: "?";
				label = className;
				if (!Array.isArray(item)) {
					try {
						let toStrVal = item.toString();
						if (toStrVal !== "[object Object]") {
							if (toStrVal.length > 15) {
								toStrVal += ` "${toStrVal.substr(0, 15)}..."`;
							}
							label += `${className}: ${toStrVal}`;
						}
					} catch (e) {}
				}
			}

			return {
				shape: "box",
				edges,
				color: item === data ? "lightblue" : undefined,
				label,
			};
		};

		collector.addExtraction({
			id: "object-graph",
			name: "Object Graph",
			priority: 98,
			extractData() {
				return createGraph([data], infoSelector, { maxSize: 50 });
			},
		});

		if (
			data.constructor === Object &&
			Object.values(data).every(
				(v) => v === undefined || v === null || typeof v === "object"
			)
		) {
			collector.addExtraction({
				id: "object-graph-pointers",
				name: "Object Graph With Pointers",
				priority: 99,
				extractData() {
					return createGraphFromPointers(data as any, infoSelector, {
						maxSize: 50,
					});
				},
			});
		}
	}
}
