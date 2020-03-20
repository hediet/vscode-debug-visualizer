import {
	Visualizer,
	VisualizationCollector,
	asVisualizationId,
} from "../../Visualizer";
import {
	ExtractedData,
	isCommonDataType,
} from "@hediet/debug-visualizer-data-extraction";
import * as React from "react";

export class TextVisualizer extends Visualizer {
	visualize(data: ExtractedData, collector: VisualizationCollector): void {
		if (isCommonDataType(data, { text: true })) {
			collector.addVisualization({
				id: asVisualizationId("text"),
				name: "Plain Text",
				priority: 90,
				render() {
					return (
						<pre style={{ marginLeft: 20, marginRight: 20 }}>
							{data.text}
						</pre>
					);
				},
			});
		}
	}
}
