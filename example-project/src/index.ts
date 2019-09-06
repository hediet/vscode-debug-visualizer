import * as ts from "typescript";
import {
	enableHotReload,
	registerUpdateReconciler,
	getReloadCount,
	hotClass,
} from "@hediet/node-reload";
enableHotReload();

/*
import {
	registerAll,
	CommonDataTypes,
} from "@hediet/debug-visualizer-data-extraction";
registerAll();
*/

registerUpdateReconciler(module);

@hotClass(module)
class Main {
	run() {
		const sf = ts.createSourceFile(
			"test",
			`
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
class Test1 {
}
class Test2 {
}
`,
			ts.ScriptTarget.Latest,
			true
		);
		let myValue: any = sf.statements[0];
		myValue = sf.statements[1];
		myValue = sf.getText();
		myValue = {
			kind: { text: true, svg: true },
			text: `<svg height="210" width="500">
		<polygon points="100,10 40,198 190,78 10,78 160,198" style="fill:lime;stroke:purple;stroke-width:5;fill-rule:nonzero;"/>
		Sorry, your browser does not support inline SVG.
	  </svg>
	  `,
		};
	}
}

if (getReloadCount(module) === 0) {
	new Main().run();
}
