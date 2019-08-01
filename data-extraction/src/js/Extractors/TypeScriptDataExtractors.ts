import * as ts from "typescript";
import { DataExtractor, ExtractionCollector } from "../DataExtractor";
import { CommonDataTypes } from "../../CommonDataTypes";

export class TypeScriptAstDataExtractor
	implements DataExtractor<CommonDataTypes.AstData> {
	readonly id = "TypeScriptAst";

	getExtractions(
		data: unknown,
		collector: ExtractionCollector<CommonDataTypes.AstData>,
		evalFn: <TEval>(expression: string) => TEval
	): void {
		if (typeof data !== "object" || data === undefined) {
			return;
		}

		const require = evalFn<(request: string) => unknown>("require");

		const tsApi = require("typescript") as typeof ts;
		if (!tsApi) {
			return;
		}

		function findKey(value: any, object: any): string | null {
			for (var key in object) {
				if (key.startsWith("_")) continue;

				var member = object[key];
				if (member === value) return key;

				if (Array.isArray(member) && member.indexOf(value) !== -1)
					return key;
			}

			return null;
		}

		function toTreeNode(
			node: ts.Node,
			memberName: string,
			marked: ts.Node
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

					return toTreeNode(childNode, parentPropertyName, marked);
				})
				.filter(c => c !== null);

			let value: string | undefined = undefined;

			if (tsApi.isIdentifier(node)) {
				value = node.text;
			}

			return {
				name: name,
				id: memberName,
				children: children,
				data: {
					length: 0,
					position: 0,
				},
				isMarked: node === marked,
				value,
				// startPos: node.pos,
				// endPos: node.end
			};
		}

		if ((tsApi as any).isNode(data)) {
			let root = data as ts.Node;
			const marked = root;
			while (root.parent) {
				root = root.parent;
			}
			collector.addExtraction({
				id: "ts-ast",
				name: "TypeScript AST",
				priority: 1000,
				extractData() {
					return {
						kind: { text: true, tree: true, ast: true },
						root: toTreeNode(root, "root", marked),
						text: root.getSourceFile().text,
						fileType: "ts",
					};
				},
			});
		}
	}
}
