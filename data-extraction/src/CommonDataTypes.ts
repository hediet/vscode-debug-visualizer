import { ExtractedData } from "./DataExtractionResult";

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

export type CommonDataType =
	| CommonDataTypes.Text
	| CommonDataTypes.Svg
	| CommonDataTypes.Html
	| CommonDataTypes.DotGraph
	| CommonDataTypes.TreeNodeData
	| CommonDataTypes.AstData
	| CommonDataTypes.GraphData;

export module CommonDataTypes {
	export interface Text {
		kind: { text: true };
		text: string;
		mimeType?: string;
		fileName?: string;
	}

	export interface GraphData {
		kind: { graph: true };
		nodes: { id: string; label: string }[];
		edges: { from: string; to: string; label: string }[];
	}

	export interface Svg extends Text {
		kind: { text: true; svg: true };
		text: string;
	}

	export interface Html extends Text {
		kind: { text: true; html: true };
		text: string;
	}

	export interface DotGraph extends Text {
		kind: { text: true; dotGraph: true };
		text: string;
	}

	export interface TreeNodeData<TData = unknown> {
		kind: { tree: true };
		root: TreeNode<TData>;
	}

	export interface AstData
		extends TreeNodeData<{
				position: number;
				length: number;
			}>,
			Text {
		kind: { text: true; tree: true; ast: true };
	}
}

export interface TreeNode<TExtraData> {
	id: string | undefined;
	name: string;
	value: string | undefined;
	emphasizedValue: string | undefined;
	children: TreeNode<TExtraData>[];
	data: TExtraData;
	isMarked: boolean;
}
