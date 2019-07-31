import { TreeViewModel, TreeNodeViewModel } from "./Views";
import { CommonDataTypes } from "@hediet/debug-visualizer-data-extraction";

export function createTreeViewModelFromTreeNodeData(
	root: CommonDataTypes.TreeNodeData["root"]
): TreeViewModel {
	const m = new TreeViewModel();
	m.root = recurse(root, m);
	return m;

	function recurse(
		root: CommonDataTypes.TreeNodeData["root"],
		viewModel: TreeViewModel
	): TreeNodeViewModel {
		const children: TreeNodeViewModel[] = root.children.map(c =>
			recurse(c, viewModel)
		);
		const model = new TreeNodeViewModel(
			viewModel,
			root.id,
			root.name,
			children
		);
		model.isMarked = root.isMarked;
		for (const c of children) {
			c.parent = model;
		}
		return model;
	}
}
