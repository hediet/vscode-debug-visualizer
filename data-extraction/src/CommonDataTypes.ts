// This file was created automatically. Do not edit it manually!

export type KnownVisualizationData =
	| TreeVisualizationData
	| AstTreeVisualizationData
	| GraphvizDotVisualizationData
	| GraphVisualizationData
	| GraphVisualizationData
	| GridVisualizationData
	| ImageVisualizationData
	| MonacoTextVisualizationData
	| MonacoTextDiffVisualizationData
	| TableVisualizationData
	| PlotlyVisualizationData
	| SimpleTextVisualizationData
	| SvgVisualizationData;

export type TreeVisualizationData = {
	kind: {
		tree: true;
	};
	root: TreeNode;
};

export type TreeNode = {
	/**
	 * The children of this tree-node
	 */
	children: TreeNode[];
	/**
	 * The parts that make up the text of this item
	 */
	items: TreeNodeItem[];
	/**
	 * If a node is selected, the concatenation of all segment values from root to the selected node is shown to the user.
	 */
	segment?: string;
	/**
	 * Marked nodes are highlighted and scrolled into view on every visualization update.
	 */
	isMarked?: boolean;
};

export type TreeNodeItem = {
	/**
	 * The text to show
	 */
	text: string;
	/**
	 * The style of the text
	 */
	emphasis?: "style1" | "style2" | "style3" | string;
};

export type AstTreeVisualizationData = {
	kind: {
		ast: true;
		tree: true;
		text: true;
	};
	root: AstTreeNode;
	text: string;
	fileName?: string;
};

export type AstTreeNode = {
	children: AstTreeNode[];
	items: AstTreeNodeItem[];
	segment?: string;
	isMarked?: boolean;
	span: {
		start: number;
		length: number;
	};
};

export type AstTreeNodeItem = {
	text: string;
	emphasis?: "style1" | "style2" | "style3" | string;
};

export type GraphvizDotVisualizationData = {
	kind: {
		dotGraph: true;
	};
	text: string;
};

export type GraphVisualizationData = {
	kind: {
		graph: true;
	};
	nodes: GraphNode[];
	edges: GraphEdge[];
};

export type GraphNode = {
	id: string;
	label?: string;
	color?: string;
	shape?: "ellipse" | "box";
};

export type GraphEdge = {
	from: string;
	to: string;
	label?: string;
	id?: string;
	color?: string;
	style?: "solid" | "dashed" | "dotted";
};

export type GridVisualizationData = {
	kind: {
		grid: true;
	};
	columnLabels?: {
		label?: string;
	}[];
	rows: {
		label?: string;
		columns: {
			content?: string;
			/**
			 * A value to identify this cell. Should be unique.
			 */
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
};

export type ImageVisualizationData = {
	kind: {
		imagePng: true;
	};
	/**
	 * The base 64 encoded PNG representation of the image
	 */
	base64Data: string;
};

export type MonacoTextVisualizationData = {
	kind: {
		text: true;
	};
	/**
	 * The text to show
	 */
	text: string;
	decorations?: {
		range: LineColumnRange;
		label?: string;
	}[];
	/**
	 * An optional filename that might be used for chosing a syntax highlighter
	 */
	fileName?: string;
};

export type LineColumnRange = {
	/**
	 * The start position
	 */
	start: LineColumnPosition;
	/**
	 * The end position
	 */
	end: LineColumnPosition;
};

export type LineColumnPosition = {
	/**
	 * The 0-based line number
	 */
	line: number;
	/**
	 * The 0-based column number
	 */
	column: number;
};

export type MonacoTextDiffVisualizationData = {
	kind: {
		text: true;
	};
	/**
	 * The text to show
	 */
	text: string;
	/**
	 * The text to compare against
	 */
	otherText: string;
	/**
	 * An optional filename that might be used for chosing a syntax highlighter
	 */
	fileName?: string;
};

export type TableVisualizationData = {
	kind: {
		table: true;
	};
	/**
	 * An array of objects. The properties of the objects are used as columns.
	 */
	rows: {}[];
};

export type PlotlyVisualizationData = {
	kind: {
		plotly: true;
	};
	/**
	 * Expecting Plotly.Data[] (https://github.com/DefinitelyTyped/DefinitelyTyped/blob/795ce172038dbafcb9cba030d637d733a7eea19c/types/plotly.js/index.d.ts#L1036)
	 */
	data: {
		text?: string | string[];
		xaxis?: string;
		yaxis?: string;
		cells?: {
			values?: string[][];
		};
		header?: {
			values?: string[];
		};
		domain?: {
			x?: number[],
			y?: number[],
		};
		x?: (string | number | null)[] | (string | number | null)[][];
		y?: (string | number | null)[] | (string | number | null)[][];
		z?: (string | number | null)[] | (string | number | null)[][];
		type?:
			| "bar"
			| "box"
			| "candlestick"
			| "choropleth"
			| "contour"
			| "heatmap"
			| "histogram"
			| "indicator"
			| "mesh3d"
			| "ohlc"
			| "parcoords"
			| "pie"
			| "pointcloud"
			| "scatter"
			| "scatter3d"
			| "scattergeo"
			| "scattergl"
			| "scatterpolar"
			| "scatterternary"
			| "sunburst"
			| "surface"
			| "treemap"
			| "waterfall"
			| "funnel"
			| "funnelarea"
			| "scattermapbox"
			| "table";
		mode?:
			| "lines"
			| "markers"
			| "text"
			| "lines+markers"
			| "text+markers"
			| "text+lines"
			| "text+lines+markers"
			| "none"
			| "gauge"
			| "number"
			| "delta"
			| "number+delta"
			| "gauge+number"
			| "gauge+number+delta"
			| "gauge+delta";
	}[];
	/**
	 * Expecting Partial<Plotly.Layout> (https://github.com/DefinitelyTyped/DefinitelyTyped/blob/795ce172038dbafcb9cba030d637d733a7eea19c/types/plotly.js/index.d.ts#L329)
	 */
	layout?: {
		title?: string;
	};
};

export type SimpleTextVisualizationData = {
	kind: {
		text: true;
	};
	text: string;
};

export type SvgVisualizationData = {
	kind: {
		svg: true;
	};
	/**
	 * The svg content
	 */
	text: string;
};
