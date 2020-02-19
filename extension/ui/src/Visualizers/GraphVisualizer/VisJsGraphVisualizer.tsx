import { observer } from "mobx-react";
import * as React from "react";
import {
	VisualizationProvider,
	VisualizationCollector,
	asVisualizationId,
} from "../Visualizer";
import {
	ExtractedData,
	isCommonDataType,
	NodeGraphData,
	EdgeGraphData,
} from "@hediet/debug-visualizer-data-extraction";
import { DataSet, Network, Options } from "vis-network";

export class VisJsGraphVisualizer extends VisualizationProvider {
	getVisualizations(
		data: ExtractedData,
		collector: VisualizationCollector
	): void {
		if (isCommonDataType(data, { graph: true })) {
			collector.addVisualization({
				id: asVisualizationId("vis-js-graph"),
				name: "vis.js",
				priority: 1001,
				render() {
					return (
						<VisJsGraphViewer
							edges={data.edges}
							nodes={data.nodes}
						/>
					);
				},
			});
		}
	}
}

@observer
export class VisJsGraphViewer extends React.Component<{
	nodes: NodeGraphData[];
	edges: EdgeGraphData[];
}> {
	private readonly divRef = React.createRef<HTMLDivElement>();
	private readonly nodes = new DataSet<{
		id: string;
		label?: string;
		color?: string;
		shape?: string;
	}>();
	private readonly edges = new DataSet<{
		id: string;
		from: string;
		to: string;
		label?: string;
		color?: string;
		dashes?: boolean;
		shape?: boolean;
	}>();

	render() {
		return <div style={{ height: "100%" }} ref={this.divRef} />;
	}

	synchronizeData() {
		const newNodes = new Set<string>();
		for (const n of this.props.nodes) {
			newNodes.add(n.id);
			this.nodes.update({
				id: n.id,
				label: n.label !== undefined ? n.label : n.id,
				color: n.color,
				shape: n.shape,
			});
		}
		this.nodes.forEach(item => {
			if (!newNodes.has(item.id)) {
				this.nodes.remove(item);
			}
		});

		function getIdOfEdge(e: EdgeGraphData): string {
			if (e.id) {
				return e.id;
			}
			return e.from + "####" + e.to + "|" + e.label;
		}

		const newEdges = new Set<string>();
		for (const n of this.props.edges) {
			const id = getIdOfEdge(n);
			newEdges.add(id);
			this.edges.update({
				id: id,
				label: n.label !== undefined ? n.label : "",
				from: n.from,
				to: n.to,
				color: n.color,
				dashes: n.dashes,
			});
		}
		this.edges.forEach(item => {
			if (!newEdges.has(item.id)) {
				this.edges.remove(item);
			}
		});
	}

	componentDidUpdate() {
		this.synchronizeData();
	}

	componentDidMount() {
		this.synchronizeData();

		const data = {
			nodes: this.nodes,
			edges: this.edges,
		};
		const options: Options = {
			edges: {
				arrows: {
					to: { enabled: true, scaleFactor: 1, type: "arrow" },
				},
			},
		};
		const network = new Network(this.divRef.current!, data, options);
	}
}
