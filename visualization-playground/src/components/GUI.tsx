import * as React from "react";
import { Button, Spinner } from "@blueprintjs/core";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import { Model } from "../model/Model";
import classnames = require("classnames");
import { knownVisualizations } from "@hediet/visualization";
import { CommonDataType } from "@hediet/debug-visualizer-data-extraction";
import { LightExpressionInput } from "./LightExpressionInput";

@observer
export class GUI extends React.Component<{ model: Model }> {
	render() {
		const m = this.props.model;

		return (
			<div
				className="component-GUI"
				style={{ display: "flex", flexDirection: "column" }}
			>
				<div className="part-header">
					<LightExpressionInput model={m.jsonExpression} />
				</div>
				<div
					className="part-visualization"
					style={{ minHeight: 0, flex: 1 }}
				>
					{this.renderVisualization()}
				</div>
			</div>
		);
	}

	renderVisualization() {
		const m = this.props.model;

		if (!m.visualizations) {
			return <div>No/Invalid Data</div>;
		}
		if (!m.visualizations.visualization) {
			return <div>Data cannot be visualized</div>;
		}
		return m.visualizations.visualization.render();
	}
}
