import { ExtractedData } from "./DataExtractionResult";

export type CommonDataType =
	| CommonDataTypes.Text
	| CommonDataTypes.Svg
	| CommonDataTypes.Html
	| CommonDataTypes.DotGraph
	| CommonDataTypes.Tree
	| CommonDataTypes.Ast
	| CommonDataTypes.Graph
	| CommonDataTypes.Plotly
	| CommonDataTypes.Grid;

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

	export interface Grid {
		kind: { array: true };
		columnLabels?: { label?: string }[];
		rows: {
			label?: string;
			columns: {
				content?: string;
				tag?: string;
				color?: string;
			}[];
		}[];
		markers?: {
			id: string;

			row: number;
			column: number;
			rows?: number;
			columns?: number;

			label?: string;
			color?: string;
		}[];
	}

	export interface Ast
		extends Tree<{
				position: number;
				length: number;
			}>,
			Text {
		kind: { text: true; tree: true; ast: true };
	}

	export interface Plotly {
		kind: { plotly: true };
		data: Partial<Plotly.Data>[];
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
	label?: string;
	color?: string;
	shape?: "ellipse" | "box";
}

export interface EdgeGraphData {
	from: string;
	to: string;
	label?: string;
	id?: string;
	color?: string;
	dashes?: boolean;
}
