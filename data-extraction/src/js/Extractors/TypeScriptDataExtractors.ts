import * as ts from "typescript";
import { DataExtractor, ExtractionCollector } from "../DataExtractor";
import { CommonDataTypes } from "../../CommonDataTypes";

export class TypeScriptAstDataExtractor
	implements DataExtractor<CommonDataTypes.AstData> {
	readonly id = "TypeScriptAst";

	getExtractions(
		data: any,
		collector: ExtractionCollector<CommonDataTypes.AstData>
	): void {
		if (typeof data !== "object" || data === undefined) {
			return;
		}

		const tsApi = require("typescript") as typeof ts | undefined;
		if (!tsApi) {
			return;
		}

		if ((tsApi as any).isNode(data)) {
			const n = data as ts.Node;
			collector.addExtraction({
				id: "ts-ast",
				name: "TypeScript AST",
				priority: 1000,
				extractData() {
					return {
						kind: { text: true, tree: true, ast: true },
						root: toTreeNode(data, "root"),
						text: n.getSourceFile().text,
						fileType: "ts",
					};
				},
			});
		}
	}
}

function findKey(value: any, object: any): string | null {
	for (var key in object) {
		if (key.startsWith("_")) continue;

		var member = object[key];
		if (member === value) return key;

		if (Array.isArray(member) && member.indexOf(value) !== -1) return key;
	}

	return null;
}

function toTreeNode(
	node: ts.Node,
	memberName: string
): CommonDataTypes.AstData["root"] {
	const name = ts.SyntaxKind[node.kind];
	const children = node
		.getChildren()
		.map((childNode, idx) => {
			let parentPropertyName = findKey(childNode, node) || "";

			if (childNode.kind == ts.SyntaxKind.SyntaxList) {
				childNode.getChildren().some(c => {
					parentPropertyName = findKey(c, node) || "";
					return !!parentPropertyName;
				});

				if (childNode.getChildren().length === 0) return null!;
			}

			if (node.kind == ts.SyntaxKind.SyntaxList) {
				parentPropertyName = "" + idx;
			}

			return toTreeNode(childNode, parentPropertyName);
		})
		.filter(c => c !== null);

	return {
		name: name,
		id: memberName,
		children: children,
		data: {
			length: 0,
			position: 0,
		},
		isSelected: false,
		// startPos: node.pos,
		// endPos: node.end
	};
}
