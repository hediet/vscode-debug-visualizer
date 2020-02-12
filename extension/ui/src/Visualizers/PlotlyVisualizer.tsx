import { observer } from "mobx-react";
import * as React from "react";
import {
	VisualizationProvider,
	VisualizationCollector,
	asVisualizationId,
} from "./Visualizer";
import {
	ExtractedData,
	isCommonDataType,
} from "@hediet/debug-visualizer-data-extraction";
import Plot from "react-plotly.js";

export class PlotlyVisualizer extends VisualizationProvider {
	getVisualizations(
		data: ExtractedData,
		collector: VisualizationCollector
	): void {
		if (isCommonDataType(data, { plotly: true })) {
			collector.addVisualization({
				id: asVisualizationId("plotly"),
				name: "plotly",
				priority: 1001,
				render() {
					return <PlotlyViewer data={data.data} />;
				},
			});
		}
	}
}

@observer
export class PlotlyViewer extends React.Component<{
	data: Partial<Plotly.Data>[];
}> {
	render() {
		return (
			<Plot
				style={{ width: "100%" }}
				data={this.props.data}
				layout={{}}
				config={{ responsive: true }}
			/>
		);
	}
}
