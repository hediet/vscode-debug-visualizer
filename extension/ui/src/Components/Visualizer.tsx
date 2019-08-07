import React = require("react");
import { Model } from "../Model/Model";
import { observer } from "mobx-react";
import { NoData } from "./NoData";

@observer
export class Visualizer extends React.Component<{ model: Model }> {
	render() {
		return (
			<div className="component-Visualizer">{this.renderContent()}</div>
		);
	}

	renderContent(): JSX.Element {
		const s = this.props.model.state;
		if (s.kind === "loading") {
			return <NoData label="Loading" />;
		} else if (s.kind === "error") {
			return <NoData label={"Error: " + s.message} />;
		} else if (s.kind === "noExpression") {
			return <NoData label="No Expression" />;
		} else if (s.kind === "noDebugSession") {
			return <NoData label="No Debug Session" />;
		} else if (s.kind === "data") {
			const vis = this.props.model.visualizations;
			if (!vis || !vis.visualization) {
				return <NoData label="No Visualization" />;
			}

			return vis.visualization.render();
		} else {
			const nvr: never = s;
			return <div />;
		}
	}
}
