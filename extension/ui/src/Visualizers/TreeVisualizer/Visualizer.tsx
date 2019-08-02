import { TreeViewModel, TreeNodeViewModel, TreeView } from "./Views";
import {
	CommonDataTypes,
	ExtractedData,
	isCommonDataType,
} from "@hediet/debug-visualizer-data-extraction";
import {
	VisualizationProvider,
	VisualizationCollector,
	VisualizationId,
	asVisualizationId,
} from "../Visualizer";
import React = require("react");

export function createTreeViewModelFromTreeNodeData(
	root: CommonDataTypes.TreeNodeData["root"]
): TreeViewModel {
	const m = new TreeViewModel();
	m.root = recurse(root, m);
	return m;

	function recurse(
		node: CommonDataTypes.TreeNodeData["root"],
		viewModel: TreeViewModel
	): TreeNodeViewModel {
		const children: TreeNodeViewModel[] = node.children.map(c =>
			recurse(c, viewModel)
		);
		const model = new TreeNodeViewModel(
			viewModel,
			node.id,
			node.name,
			node.value,
			children
		);
		model.isMarked = node.isMarked;
		for (const c of children) {
			c.parent = model;
		}
		return model;
	}
}

export class TreeVisualizer extends VisualizationProvider {
	getVisualizations(
		data: ExtractedData,
		collector: VisualizationCollector
	): void {
		if (isCommonDataType(data, { tree: true })) {
			collector.addVisualization({
				id: asVisualizationId("tree"),
				name: "Tree",
				priority: 100,
				render() {
					const m = createTreeViewModelFromTreeNodeData(data.root);
					return <TreeView model={m} />;
				},
			});
		}
	}
}
