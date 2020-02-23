import * as ts from "typescript";
import { getDataExtractorApi } from "@hediet/debug-visualizer-data-extraction";
import { MockLanguageServiceHost } from "./MockLanguageServiceHost";

// Registers all existing extractors.
getDataExtractorApi().registerDefaultExtractors();

setTimeout(() => {
	new Main().run();
}, 0);

class Main {
	run() {
		const files = new Map<string, string>([
			[
				"main.ts",
				`
class Test1 {
	public foo(a: number) {
		const x = { a: 5 };
	}
}
`,
			],
		]);
		const serviceHost = new MockLanguageServiceHost(files, {});
		const baseService = ts.createLanguageService(
			serviceHost,
			ts.createDocumentRegistry()
		);
		const prog = baseService.getProgram()!;
		debugger;

		const c = prog.getTypeChecker();
		let myValue = undefined; // Visualize `myValue` here!
		const sourceFileAst = prog.getSourceFiles()[0];
		myValue = sourceFileAst.getText();
		console.log("myValue is the source code of the AST");
		debugger;

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
		debugger;

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
		debugger;

		for (const ident of identifiers) {
			myValue = ident;
			console.log("myValue is an identifier");
			debugger;
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
