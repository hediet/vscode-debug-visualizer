import { TreeViewModel, TreeNodeViewModel, TreeWithPathView } from "./Views";
import React = require("react");

export function SampleTreeVisualizer() {
	interface SampleTreeNode {
		parentPropertyName: string | undefined;
		name: string;
		children: SampleTreeNode[];
	}

	const data = require("./sample-input.json") as SampleTreeNode;

	const m = new TreeViewModel();
	m.root = createModel(data, m);
	m.root.children[0].children[4].children[1].children[0].isMarked = true;

	function createModel(
		root: SampleTreeNode,
		viewModel: TreeViewModel
	): TreeNodeViewModel {
		const children: TreeNodeViewModel[] = root.children.map(c =>
			createModel(c, viewModel)
		);
		const model = new TreeNodeViewModel(
			viewModel,
			root.parentPropertyName,
			root.name,
			children
		);
		for (const c of children) {
			c.parent = model;
		}
		return model;
	}

	return <TreeWithPathView model={m} />;
}
