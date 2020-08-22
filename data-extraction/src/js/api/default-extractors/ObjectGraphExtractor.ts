import { VisualizationData } from "../../../DataExtractionResult";
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../DataExtractorApi";
import { createGraph, CreateGraphEdge } from "../../helpers";

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

		collector.addExtraction({
			id: "object-graph",
			name: "Object Graph",
			priority: 99,
			extractData() {
				return createGraph(
					[data],
					item => {
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
						}

						return {
							shape: "box",
							edges,
							color: item === data ? "lightblue" : undefined,
							label,
						};
					},
					{ maxSize: 50 }
				);
			},
		});
	}
}
