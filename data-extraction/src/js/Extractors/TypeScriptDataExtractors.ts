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
		if (!data) {
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
			marked: Set<ts.Node>
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
				isMarked: marked.has(node),
				value,
				// startPos: node.pos,
				// endPos: node.end
			};
		}

		function isNode(node: unknown): node is ts.Node {
			return typeof node === "object" && (tsApi as any).isNode(node);
		}

		if (isNode(data) || (Array.isArray(data) && data.every(isNode))) {
			let root: ts.SourceFile;
			let marked: Set<ts.Node>;
			if (Array.isArray(data)) {
				root = (data[0] as ts.Node).getSourceFile();
				marked = new Set(data);
			} else {
				root = data.getSourceFile();
				marked = new Set([data]);
			}

			collector.addExtraction({
				id: "ts-ast",
				name: "TypeScript AST",
				priority: 1000,
				extractData() {
					return {
						kind: { text: true, tree: true, ast: true },
						root: toTreeNode(root, "root", marked),
						text: root.text,
						fileType: "ts",
					};
				},
			});
		}
	}
}
