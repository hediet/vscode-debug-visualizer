import * as React from "react";
import {
	Visualizer,
	VisualizationCollector,
	asVisualizationId,
} from "../../Visualizer";
import {
	ExtractedData,
	isCommonDataType,
} from "@hediet/debug-visualizer-data-extraction";
import { makeLazyLoadable } from "../../LazyLoadable";
// import { DataSet, Network, Options } from "vis-network";

const VisJsGraphViewerLazyLoadable = makeLazyLoadable(
	async () => (await import("./VisJsGraphViewer")).VisJsGraphViewer
);

export class VisJsGraphVisualizer extends Visualizer {
	visualize(data: ExtractedData, collector: VisualizationCollector): void {
		if (isCommonDataType(data, { graph: true })) {
			collector.addVisualization({
				id: asVisualizationId("vis-js-graph"),
				name: "vis.js",
				priority: 1001,
				render() {
					return (
						<VisJsGraphViewerLazyLoadable
							edges={data.edges}
							nodes={data.nodes}
						/>
					);
				},
			});
		}
	}
}
