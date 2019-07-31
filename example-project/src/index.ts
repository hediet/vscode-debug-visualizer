import {
	enableHotReload,
	registerUpdateReconciler,
	getReloadCount,
	hotClass,
} from "@hediet/node-reload";
import {
	getDataExtractorApi,
	TypeScriptAstDataExtractor,
	CommonDataTypes,
} from "@hediet/debug-visualizer-data-extraction";
enableHotReload();
import * as ts from "typescript";

registerUpdateReconciler(module);

getDataExtractorApi().registerExtractor(new TypeScriptAstDataExtractor());

@hotClass(module)
class Main {
	run() {
		const sf = ts.createSourceFile(
			"test",
			`
class Test {
    public test() {
		console.log("aaa");
		const x =  4 + 1;
    }
}        
`,
			ts.ScriptTarget.Latest,
			true
		);

		console.log(sf);
		//new TypeScriptAstDataExtractor().getExtractions(sf, );

		debugger;
	}
}

if (getReloadCount(module) === 0) {
	new Main().run();
}
