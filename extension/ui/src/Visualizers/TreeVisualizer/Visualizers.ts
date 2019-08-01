import { TreeViewModel, TreeNodeViewModel } from "./Views";
import { CommonDataTypes } from "@hediet/debug-visualizer-data-extraction";

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
