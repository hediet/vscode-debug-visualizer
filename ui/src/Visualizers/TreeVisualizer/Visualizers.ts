import { TreeViewModel, TreeNodeViewModel } from "./Views";
import { TreeNodeData } from "@hediet/debug-visualizer-data-extraction";

export function createTreeViewModelFromTreeNodeData(
	root: TreeNodeData["root"]
): TreeViewModel {
	const m = new TreeViewModel();
	m.root = recurse(root, m);
	return m;

	function recurse(
		root: TreeNodeData["root"],
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
		for (const c of children) {
			c.parent = model;
		}
		return model;
	}
}
