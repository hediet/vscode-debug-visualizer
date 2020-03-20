import { observer, disposeOnUnmount } from "mobx-react";
import * as React from "react";
import { observable, autorun, runInAction } from "mobx";
import { SvgViewer } from "../SvgVisualizer";
import {
	Visualizer,
	VisualizationCollector,
	asVisualizationId,
} from "../../Visualizer";
import {
	ExtractedData,
	isCommonDataType,
} from "@hediet/debug-visualizer-data-extraction";

export class GraphvizDotVisualizer extends Visualizer {
	visualize(data: ExtractedData, collector: VisualizationCollector): void {
		if (isCommonDataType(data, { dotGraph: true })) {
			collector.addVisualization({
				id: asVisualizationId("graphviz-dot"),
				name: "Graphviz (Dot Data)",
				priority: 100,
				render() {
					return <GraphvizDotViewer dotCode={data.text} />;
				},
			});
		}
	}
}

class VisLoader {
	private result: any | undefined;

	async getViz(): Promise<any> {
		if (!this.result) {
			const Viz = await import("viz.js");
			const { Module, render } = await import("viz.js/full.render.js");

			const viz = new Viz.default({
				Module: () => Module({ TOTAL_MEMORY: 1 << 30 }),
				render,
			});

			this.result = viz;
		}
		return this.result;
	}
}

const vizLoader = new VisLoader();

@observer
export class GraphvizDotViewer extends React.Component<{
	dotCode: string;
	svgRef?: (element: SVGSVGElement | null) => void;
}> {
	@observable private svg: string | null = null;

	@disposeOnUnmount
	// @ts-ignore
	private readonly _updateSvgAutorun = autorun(async () => {
		const viz = await vizLoader.getViz();
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
