import { ExtractedData } from "./DataExtractionResult";

export type CommonDataType =
	| CommonDataTypes.Text
	| CommonDataTypes.Svg
	| CommonDataTypes.Html
	| CommonDataTypes.DotGraph
	| CommonDataTypes.Tree
	| CommonDataTypes.Ast
	| CommonDataTypes.Graph;

export function isCommonDataType<T>(
	data: ExtractedData,
	kind: T
): data is Narrow<CommonDataType, { kind: T }> {
	for (const key of Object.keys(kind)) {
		if (!(key in data.kind)) {
			return false;
		}
	}
	return true;
}

type Narrow<T, TKind> = T extends TKind ? T : never;

export module CommonDataTypes {
	export interface Text {
		kind: { text: true };
		text: string;
		mimeType?: string;
		fileName?: string;
	}

	export interface Graph {
		kind: { graph: true };
		nodes: NodeGraphData[];
		edges: EdgeGraphData[];
	}

	export interface Svg extends Text {
		kind: { text: true; svg: true };
	}

	export interface Html extends Text {
		kind: { text: true; html: true };
	}

	export interface DotGraph extends Text {
		kind: { text: true; dotGraph: true };
	}

	export interface Tree<TData = unknown> {
		kind: { tree: true };
		root: TreeNode<TData>;
	}

	export interface Ast
		extends Tree<{
				position: number;
				length: number;
			}>,
			Text {
		kind: { text: true; tree: true; ast: true };
	}
}

export interface TreeNode<TExtraData> {
	name: string;
	children: TreeNode<TExtraData>[];
	data: TExtraData;
	id?: string;
	value?: string;
	emphasizedValue?: string;
	isMarked?: boolean;
}

export interface NodeGraphData {
	id: string;
	label: string;
	color?: string;
}

export interface EdgeGraphData {
	from: string;
	to: string;
	label: string;
	id?: string;
	color?: string;
	weight?: number;
}
