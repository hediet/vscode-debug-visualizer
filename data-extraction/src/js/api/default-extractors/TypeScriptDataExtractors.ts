import * as ts from "typescript"; // Only compile-time import!
import { AstTreeNode } from "../../..";
import { AstTreeVisualizationData } from "../../../CommonDataTypes";
import { expect } from "../../../util";
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../DataExtractorApi";

export class TypeScriptAstDataExtractor implements DataExtractor {
	readonly id = "typescript-ast";

	getExtractions(
		data: unknown,
		collector: ExtractionCollector,
		{ evalFn }: DataExtractorContext
	): void {
		if (!data) {
			return;
		}

		function getApi(): typeof ts {
			if (typeof data === "object" && "typescript" in (data as object)) {
				return (data as any).typescript;
			} else {
				// This might refer to global.require which uses CWD for resolution!
				const require = evalFn<(request: string) => unknown>("require");
				return require("typescript") as typeof ts;
			}
		}

		let tsApi: typeof ts;
		try {
			tsApi = getApi();
			if (!tsApi) {
				return;
			}
		} catch (e) {
			return;
		}

		const helper = new Helper(tsApi);

		let rootSourceFile: ts.SourceFile | undefined = undefined;
		let rootNode: ts.Node | undefined = undefined;
		let marked: Set<ts.Node>;
		let fn: (n: ts.Node) => string | undefined = (n: ts.Node) => undefined;
		if (
			Array.isArray(data) &&
			data.every(helper.isNode) &&
			data.length > 0
		) {
			rootSourceFile = helper.getSourceFile(data[0] as ts.Node);
			marked = new Set(data);
		} else if (helper.isNode(data)) {
			rootSourceFile = helper.getSourceFile(data);
			marked = new Set([data]);
		} else if (typeof data === "object" && data) {
			marked = new Set();
			const map = new Map<ts.Node, string>();
			fn = (n: ts.Node) => map.get(n);
			for (const [key, item] of Object.entries(data)) {
				if (key === "fn") {
					fn = item;
				} else if (key === "typescript") {
				} else {
					if (key === "rootNode") {
						rootNode = item;
					}
					let nodes: Array<ts.Node>;
					if (helper.isNode(item)) {
						nodes = [item];
					} else if (
						Array.isArray(item) &&
						item.every(helper.isNode)
					) {
						nodes = item;
					} else {
						return;
					}
					if (nodes.length > 0 && !rootSourceFile) {
						rootSourceFile = helper.getSourceFile(nodes[0]);
					}
					for (const n of nodes) {
						marked.add(n);
						map.set(n, key);
					}
				}
			}
		} else {
			return;
		}

		if (!rootSourceFile) {
			return;
		}
		const finalRootSourceFile = rootSourceFile;

		collector.addExtraction({
			id: "ts-ast",
			name: "TypeScript AST",
			priority: 1000,
			extractData() {
				return expect<AstTreeVisualizationData>({
					kind: { text: true, tree: true, ast: true },
					root: helper.toTreeNode(
						rootNode || finalRootSourceFile,
						"root",
						marked,
						fn
					),
					text: finalRootSourceFile.text,
					fileName: "index.ts",
				});
			},
		});
	}
}

class Helper {
	constructor(private readonly tsApi: typeof ts) {}

	findKey(value: any, object: any): string | null {
		for (var key in object) {
			if (key.startsWith("_")) continue;

			var member = object[key];
			if (member === value) return key;

			if (Array.isArray(member) && member.indexOf(value) !== -1) {
				return key;
			}
		}

		return null;
	}

	getChildren(node: ts.Node): ts.Node[] {
		const result = new Array<ts.Node>();
		this.tsApi.forEachChild(node, n => {
			result.push(n);
		});
		return result;
	}

	toTreeNode(
		node: ts.Node,
		memberName: string,
		marked: Set<ts.Node>,
		emphasizedValueFn: (node: ts.Node) => string | undefined
	): AstTreeNode {
		const name = this.tsApi.SyntaxKind[node.kind];
		const children = this.getChildren(node)
			.map((childNode, idx) => {
				let parentPropertyName = this.findKey(childNode, node) || "";
				if (childNode.kind == this.tsApi.SyntaxKind.SyntaxList) {
					const children = this.getChildren(childNode);
					children.some(c => {
						parentPropertyName = this.findKey(c, node) || "";
						return !!parentPropertyName;
					});

					if (children.length === 0) return null!;
				}

				if (node.kind == this.tsApi.SyntaxKind.SyntaxList) {
					parentPropertyName = "" + idx;
				}

				return this.toTreeNode(
					childNode,
					parentPropertyName,
					marked,
					emphasizedValueFn
				);
			})
			.filter(c => c !== null);

		let value: string | undefined = undefined;

		if (this.tsApi.isIdentifier(node)) {
			value = node.text || (node.escapedText as string);
		} else if (this.tsApi.isLiteralExpression(node)) {
			value = node.text;
		}

		const items: AstTreeNode["items"] = [
			{ text: `${memberName}: `, emphasis: "style1" },
			{ text: name },
		];

		const emphasizedVal = emphasizedValueFn(node);
		if (value) {
			items.push({ text: value, emphasis: "style2" });
		}
		if (emphasizedVal) {
			items.push({ text: emphasizedVal, emphasis: "style3" });
		}

		return {
			items,
			children: children,
			span: {
				length: node.end - node.pos,
				start: node.pos,
			},
			isMarked: marked.has(node),
		};
	}

	isNode = (node: unknown): node is ts.Node => {
		return (
			typeof node === "object" &&
			node !== null &&
			(this.tsApi.isToken(node as any) ||
				(this.tsApi as any).isNode(node))
		);
	};

	getSourceFile(node: ts.Node | any): ts.SourceFile {
		if (!node) {
			throw new Error("Detached node");
		}
		if (this.tsApi.isSourceFile(node)) {
			return node;
		}
		if (!("getSourceFile" in node)) {
			return this.getSourceFile(node.parent);
		}
		return node.getSourceFile();
	}
}
