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
import { DataSet, Network } from "vis-network";

export class VisJsGraphVisualizer extends VisualizationProvider {
	getVisualizations(
		data: ExtractedData,
		collector: VisualizationCollector
	): void {
		if (isCommonDataType(data, { graph: true })) {
			collector.addVisualization({
				id: asVisualizationId("vis-js-graph"),
				name: "VisJs Graph",
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

interface GraphNode {
	id: string;
	label: string;
}

interface GraphEdge {
	id?: string;
	label: string;
	from: string;
	to: string;
}

@observer
export class VisJsGraphViewer extends React.Component<{
	nodes: GraphNode[];
	edges: GraphEdge[];
}> {
	private readonly divRef = React.createRef<HTMLDivElement>();
	private readonly nodes = new DataSet<{ id: string; label: string }>();
	private readonly edges = new DataSet<{
		id: string;
		label: string;
		from: string;
		to: string;
	}>();

	render() {
		//const { nodes, edges } = this.props;
		return <div style={{ height: "100%" }} ref={this.divRef} />;
	}

	synchronizeData() {
		const newNodes = new Set<string>();
		for (const n of this.props.nodes) {
			newNodes.add(n.id);
			this.nodes.update({ id: n.id, label: n.label });
		}
		this.nodes.forEach(item => {
			if (!newNodes.has(item.id)) {
				this.nodes.remove(item);
			}
		});

		function getIdOfEdge(e: GraphEdge): string {
			if (e.id) {
				return e.id;
			}
			return e.from + "####" + e.to;
		}

		const newEdges = new Set<string>();
		for (const n of this.props.edges) {
			const id = getIdOfEdge(n);
			newEdges.add(id);
			this.edges.update({
				id: id,
				label: n.label,
				from: n.from,
				to: n.to,
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
		const options = {
			edges: {
				arrows: {
					to: { enabled: true, scaleFactor: 1, type: "arrow" },
				},
			},
		};
		const network = new Network(this.divRef.current!, data, options);
		//network.stabilize();
	}
}
