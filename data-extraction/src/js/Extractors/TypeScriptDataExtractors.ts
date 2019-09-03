import * as ts from "typescript";
import { DataExtractor, ExtractionCollector } from "../DataExtractor";
import { CommonDataTypes } from "../../CommonDataTypes";

// This class is self contained and can be injected into both nodejs and browser environments.
export class TypeScriptAstDataExtractor
	implements DataExtractor<CommonDataTypes.AstData> {
	readonly id = "TypeScriptAst";

	getExtractions(
		data: unknown,
		collector: ExtractionCollector<CommonDataTypes.AstData>,
		evalFn: <TEval>(expression: string) => TEval
	): void {
		if (!data) {
			return;
		}

		let tsApi: typeof ts = undefined as any;
		if (typeof data === "object" && "typescript" in (data as object)) {
			tsApi = (data as any).typescript;
		} else {
			const require = evalFn<(request: string) => unknown>("require");
			tsApi = require("typescript") as typeof ts;
		}

		if (!tsApi) {
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

		function toTreeNode(
			node: ts.Node,
			memberName: string,
			marked: Set<ts.Node>,
			emphasizedValueFn: (node: ts.Node) => string | undefined
		): CommonDataTypes.AstData["root"] {
			const name = tsApi.SyntaxKind[node.kind];
			const children = node
				.getChildren()
				.map((childNode, idx) => {
					let parentPropertyName = findKey(childNode, node) || "";
					if (childNode.kind == tsApi.SyntaxKind.SyntaxList) {
						childNode.getChildren().some(c => {
							parentPropertyName = findKey(c, node) || "";
							return !!parentPropertyName;
						});

						if (childNode.getChildren().length === 0) return null!;
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
				value = node.text;
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

		let root: ts.SourceFile | undefined = undefined;
		let marked: Set<ts.Node>;
		let fn: (n: ts.Node) => string | undefined = (n: ts.Node) => undefined;
		if (Array.isArray(data) && data.every(isNode)) {
			root = (data[0] as ts.Node).getSourceFile();
			marked = new Set(data);
		} else if (isNode(data)) {
			root = data.getSourceFile();
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
					let nodes: Array<ts.Node>;
					if (isNode(item)) {
						nodes = [item];
					} else if (Array.isArray(item) && item.every(isNode)) {
						nodes = item;
					} else {
						return;
					}
					if (nodes.length > 0 && !root) {
						root = nodes[0].getSourceFile();
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

		if (!root) {
			return;
		}
		const finalRoot = root;

		collector.addExtraction({
			id: "ts-ast",
			name: "TypeScript AST",
			priority: 1000,
			extractData() {
				return {
					kind: { text: true, tree: true, ast: true },
					root: toTreeNode(finalRoot, "root", marked, fn),
					text: finalRoot.text,
					fileName: "index.ts",
				};
			},
		});
	}
}
