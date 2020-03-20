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

const PlotlyViewerLazyLoadable = makeLazyLoadable(
	async () => (await import("./PlotlyViewer")).PlotlyViewer
);

export class PlotlyVisualizer extends Visualizer {
	visualize(data: ExtractedData, collector: VisualizationCollector): void {
		if (isCommonDataType(data, { plotly: true })) {
			collector.addVisualization({
				id: asVisualizationId("plotly"),
				name: "plotly",
				priority: 1001,
				render() {
					return <PlotlyViewerLazyLoadable data={data.data} />;
				},
			});
		}
	}
}
