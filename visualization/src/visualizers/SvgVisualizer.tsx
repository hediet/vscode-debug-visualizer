import Measure, { ContentRect } from "react-measure";
import { observer } from "mobx-react";
import * as React from "react";
import { observable, action } from "mobx";
import { Tool, ReactSVGPanZoom, Value } from "react-svg-pan-zoom";
import {
	Visualizer,
	VisualizationCollector,
	asVisualizationId,
} from "../Visualizer";
import {
	ExtractedData,
	isCommonDataType,
} from "@hediet/debug-visualizer-data-extraction";

export class SvgVisualizer extends Visualizer {
	visualize(data: ExtractedData, collector: VisualizationCollector): void {
		if (isCommonDataType(data, { svg: true })) {
			collector.addVisualization({
				id: asVisualizationId("svg"),
				name: "Svg",
				priority: 100,
				render() {
					return <SvgViewer svgContent={data.text} />;
				},
			});
		}
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
							value={val as any}
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
