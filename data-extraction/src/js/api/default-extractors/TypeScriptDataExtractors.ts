import * as ts from "typescript"; // Only compile-time import!
import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
} from "../DataExtractorApi";
import { CommonDataTypes } from "../../../CommonDataTypes";

// This class is self contained and can be injected into both nodejs and browser environments.
export class TypeScriptAstDataExtractor
	implements DataExtractor<CommonDataTypes.Ast> {
	readonly id = "typescript-ast";

	getExtractions(
		data: unknown,
		collector: ExtractionCollector<CommonDataTypes.Ast>,
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

		function findKey(value: any, object: any): string | null {
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

		function getChildren(node: ts.Node): ts.Node[] {
			const result = new Array<ts.Node>();
			tsApi.forEachChild(node, n => {
				result.push(n);
			});
			return result;
		}

		function toTreeNode(
			node: ts.Node,
			memberName: string,
			marked: Set<ts.Node>,
			emphasizedValueFn: (node: ts.Node) => string | undefined
		): CommonDataTypes.Ast["root"] {
			const name = tsApi.SyntaxKind[node.kind];
			const children = getChildren(node)
				.map((childNode, idx) => {
					let parentPropertyName = findKey(childNode, node) || "";
					if (childNode.kind == tsApi.SyntaxKind.SyntaxList) {
						const children = getChildren(childNode);
						children.some(c => {
							parentPropertyName = findKey(c, node) || "";
							return !!parentPropertyName;
						});

						if (children.length === 0) return null!;
					}

					if (node.kind == tsApi.SyntaxKind.SyntaxList) {
						parentPropertyName = "" + idx;
					}

					return toTreeNode(
						childNode,
						parentPropertyName,
						marked,
						emphasizedValueFn
					);
				})
				.filter(c => c !== null);

			let value: string | undefined = undefined;

			if (tsApi.isIdentifier(node)) {
				value = node.text || (node.escapedText as string);
			} else if (tsApi.isLiteralExpression(node)) {
				value = node.text;
			}

			return {
				name: name,
				id: memberName,
				children: children,
				data: {
					length: node.end - node.pos,
					position: node.pos,
				},
				emphasizedValue: emphasizedValueFn(node),
				isMarked: marked.has(node),
				value,
			};
		}

		function isNode(node: unknown): node is ts.Node {
			return (
				typeof node === "object" &&
				node !== null &&
				(tsApi.isToken(node as any) || (tsApi as any).isNode(node))
			);
		}

		function getSourceFile(node: ts.Node | any): ts.SourceFile {
			if (!node) {
				throw new Error("Detached node");
			}
			if (tsApi.isSourceFile(node)) {
				return node;
			}
			if (!("getSourceFile" in node)) {
				return getSourceFile(node.parent);
			}
			return node.getSourceFile();
		}

		let rootSourceFile: ts.SourceFile | undefined = undefined;
		let rootNode: ts.Node | undefined = undefined;
		let marked: Set<ts.Node>;
		let fn: (n: ts.Node) => string | undefined = (n: ts.Node) => undefined;
		if (Array.isArray(data) && data.every(isNode) && data.length > 0) {
			rootSourceFile = getSourceFile(data[0] as ts.Node);
			marked = new Set(data);
		} else if (isNode(data)) {
			rootSourceFile = getSourceFile(data);
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
					if (isNode(item)) {
						nodes = [item];
					} else if (Array.isArray(item) && item.every(isNode)) {
						nodes = item;
					} else {
						return;
					}
					if (nodes.length > 0 && !rootSourceFile) {
						rootSourceFile = getSourceFile(nodes[0]);
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
				return {
					kind: { text: true, tree: true, ast: true },
					root: toTreeNode(
						rootNode || finalRootSourceFile,
						"root",
						marked,
						fn
					),
					text: finalRootSourceFile.text,
					fileName: "index.ts",
				};
			},
		});
	}
}
