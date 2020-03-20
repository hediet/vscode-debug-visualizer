import * as React from "react";
import { Button, Spinner } from "@blueprintjs/core";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import { Model } from "../model/Model";
import classnames = require("classnames");
import { knownVisualizations } from "@hediet/visualization";
import {
	ExtractedData,
	CommonDataType,
} from "@hediet/debug-visualizer-data-extraction";

@observer
export class GUI extends React.Component<{ model: Model }> {
	render() {
		const m = this.props.model;
		const e: CommonDataType = {
			kind: { graph: true },
			nodes: [
				{ id: "1", label: "1" },
				{ id: "2", label: "2" },
			],
			edges: [
				{
					from: "1",
					to: "2",
				},
			],
		};
		const result = knownVisualizations.getBestVisualization(e, undefined);

		return (
			<div className="component-GUI">
				{result.visualization!.render()}
			</div>
		);
	}
}
