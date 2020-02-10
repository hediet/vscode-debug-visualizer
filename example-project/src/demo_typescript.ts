import * as ts from "typescript";
import { registerDefaultDataExtractors } from "@hediet/debug-visualizer-data-extraction";
import { MockLanguageServiceHost } from "./MockLanguageServiceHost";

registerDefaultDataExtractors();

setTimeout(() => {
	new Main().run();
}, 0);

class Main {
	run() {
		const mainFile = {
			name: "main.ts",
			content: `
class Test1 {
	public foo(a: number) {
	}
}
		`,
		};
		const files = new Map<string, string>([
			[mainFile.name, mainFile.content],
		]);
		const serviceHost = new MockLanguageServiceHost(files, {});
		const baseService = ts.createLanguageService(
			serviceHost,
			ts.createDocumentRegistry()
		);
		const prog = baseService.getProgram()!;

		const identifiers = new Array<ts.Identifier>();
		function traverse(node: ts.Node) {
			if (ts.isIdentifier(node)) identifiers.push(node);
			node.forEachChild(traverse);
		}
		traverse(prog.getSourceFiles()[0]);

		const c = prog.getTypeChecker();
		let myValue = undefined;
		const sourceFileAst = prog.getSourceFiles()[0];
		myValue = sourceFileAst.getText();
		console.log("myValue is the source code of the AST");

		myValue = {
			sf: sourceFileAst,
			fn: (n: ts.Node) => {
				try {
					const t = c.getTypeAtLocation(n);
					return t ? c.typeToString(t) : undefined;
				} catch (e) {
					return "" + e;
				}
			},
		};
		console.log("myValue is AST, annotated with type information");

		myValue = {
			sf: sourceFileAst,
			fn: (n: ts.Node) => {
				try {
					const t = c.getSymbolAtLocation(n);
					return t ? ts.SymbolFlags[t.flags] : undefined;
				} catch (e) {
					return "" + e;
				}
			},
		};
		console.log("myValue is AST, annotated with symbol information");

		for (const ident of identifiers) {
			myValue = ident;
			console.log("myValue is an identifier");
		}
	}
}

/*
		myValue = {
			kind: { text: true, svg: true },
			text: `
				<svg height="210" width="500">
					<polygon
						points="100,10 40,198 190,78 10,78 160,198"
						style="fill:lime;stroke:purple;stroke-width:5;fill-rule:nonzero;"
					/>
				</svg>
	  		`,
		};*/
