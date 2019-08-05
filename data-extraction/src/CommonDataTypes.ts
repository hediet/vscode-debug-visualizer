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
	export interface Text extends ExtractedData {
		kind: { text: true };
		text: string;
		// what should be used here? File type (.ts, .txt) or mime type?
		fileType?: string;
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

	export interface TreeNodeData extends ExtractedData {
		kind: { tree: true };
		root: TreeNode<{}>;
	}

	export interface AstData extends TreeNodeData, Text {
		kind: { text: true; tree: true; ast: true };
		root: TreeNode<{
			position: number;
			length: number;
		}>;
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
