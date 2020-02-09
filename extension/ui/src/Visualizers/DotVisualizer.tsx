import { observer, disposeOnUnmount } from "mobx-react";
import * as React from "react";
import { observable, autorun, runInAction } from "mobx";
import Viz from "viz.js";
import { Module, render } from "viz.js/full.render.js";
import { SvgViewer } from "./SvgVisualizer";
import {
	VisualizationProvider,
	VisualizationCollector,
	asVisualizationId,
} from "./Visualizer";
import {
	ExtractedData,
	isCommonDataType,
} from "@hediet/debug-visualizer-data-extraction";

const viz: any = new Viz({
	Module: () => Module({ TOTAL_MEMORY: 1 << 30 }),
	render,
});

export class DotVisualizer extends VisualizationProvider {
	getVisualizations(
		data: ExtractedData,
		collector: VisualizationCollector
	): void {
		if (isCommonDataType(data, { dotGraph: true })) {
			collector.addVisualization({
				id: asVisualizationId("dot-graph"),
				name: "Dot Graph",
				priority: 100,
				render() {
					return <DotViewer dotCode={data.text} />;
				},
			});
		}
	}
}

@observer
export class DotViewer extends React.Component<{
	dotCode: string;
	svgRef?: (element: SVGSVGElement | null) => void;
}> {
	@observable private svg: string | null = null;

	@disposeOnUnmount
	// @ts-ignore
	private readonly _updateSvgAutorun = autorun(async () => {
		const svg = await viz.renderString(this.props.dotCode);
		runInAction("Update svg", () => (this.svg = svg));
	});

	render() {
		if (!this.svg) {
			return <div>Loading...</div>;
		}
		return <SvgViewer svgRef={this.props.svgRef} svgContent={this.svg} />;
	}
}
