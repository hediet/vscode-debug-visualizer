import { observer } from "mobx-react";
import * as React from "react";
import Plot from "react-plotly.js";

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
