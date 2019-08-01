import { ExtractedData } from "./DataExtractionResult";

export module CommonDataTypes {
	export interface Text extends ExtractedData {
		kind: { text: true };
		text: string;
		// what should be used here? File type (.ts, .txt) or mime type?
		fileType?: string;
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
	children: TreeNode<TExtraData>[];
	data: TExtraData;
	isMarked: boolean;
}
