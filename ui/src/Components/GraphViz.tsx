import { observer, disposeOnUnmount } from "mobx-react";
import * as classNames from "classnames";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactSVGPanZoom, Tool, Value } from "react-svg-pan-zoom";
import { computed, observable, autorun, runInAction, action } from "mobx";
import Measure, { ContentRect } from "react-measure";
import Viz from "viz.js";
import { Module, render } from "viz.js/full.render.js";

export interface GraphData {
	kind: "GraphData";
	nodes: { id: string; label: string }[];
	edges: { from: string; to: string; label: string }[];
}

@observer
export class DotGraphViewer extends React.Component<{ data: GraphData }> {
	render() {
		const { nodes, edges } = this.props.data;
		const dotContent = `
            digraph MyGraph {
                ${nodes
					.map(n => `${n.id} [ label = ${JSON.stringify(n.label)} ];`)
					.join("\n ")}
                ${edges
					.map(
						e =>
							`${e.from} -> ${e.to} [ label = ${JSON.stringify(
								e.label
							)} ];`
					)
					.join("\n")}
            }
        `;
		return <DotViewer dotCode={dotContent} />;
	}
}

const viz: any = new Viz({
	Module: () => Module({ TOTAL_MEMORY: 1 << 30 }),
	render,
});

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

function widthOrDefault(r: ContentRect): number {
	if (r.bounds && r.bounds.width) {
		return r.bounds.width;
	}
	return 1;
}

function heightOrDefault(r: ContentRect): number {
	console.log(r);
	if (r.bounds && r.bounds.height) {
		return r.bounds.height;
	}
	return 1;
}

@observer
export class SvgViewer extends React.Component<{
	svgContent: string;
	svgRef?: (element: SVGSVGElement | null) => void;
}> {
	@observable tool: Tool = "pan";

	@action.bound
	private setTool(tool: Tool): void {
		this.tool = tool;
	}

	private setRef(element: ReactSVGPanZoom | null) {
		if (this.props.svgRef) {
			if (!element) {
				this.props.svgRef(null);
				return;
			}

			const svg = (element as any).ViewerDOM as SVGSVGElement;
			this.props.svgRef(svg);
		}
	}

	@observable value: Value | {} = {};

	render() {
		let { svgContent } = this.props;
		let width: number = 0;
		let height: number = 0;
		svgContent = svgContent.replace(
			/viewBox="[0-9\.]+ [0-9\.]+ ([0-9\.]+) ([0-9\.]+)"/,
			(r, w, h) => {
				width = parseFloat(w);
				height = parseFloat(h);
				return "";
			}
		);
		const tool = this.tool;
		const val = this.value;

		return (
			<Measure bounds>
				{({ measureRef, contentRect }) => (
					<div ref={measureRef} className="svgViewer">
						<ReactSVGPanZoom
							width={widthOrDefault(contentRect)}
							height={heightOrDefault(contentRect)}
							tool={tool}
							value={val}
							onChangeValue={v => (this.value = v)}
							onChangeTool={this.setTool}
							ref={e => this.setRef(e)}
						>
							<svg width={width} height={height}>
								<g
									dangerouslySetInnerHTML={{
										__html: svgContent,
									}}
								/>
							</svg>
						</ReactSVGPanZoom>
					</div>
				)}
			</Measure>
		);
	}
}
