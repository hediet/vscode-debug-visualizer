import {
	enableHotReload,
	registerUpdateReconciler,
	getReloadCount,
	hotClass,
} from "@hediet/node-reload";
import {
	registerAll,
	CommonDataTypes,
} from "@hediet/debug-visualizer-data-extraction";
enableHotReload();
import * as ts from "typescript";
//import { liveLogId, liveLog } from "@hediet/live-debug";

registerUpdateReconciler(module);

registerAll();

/*
let i = 0;
setInterval(() => {
	i++;
	liveLog("bla" + i * 2);
	liveLog("test" + i);
}, 1000);
*/

@hotClass(module)
class Main {
	run() {
		const sf = ts.createSourceFile(
			"test",
			`
class uiae {

}

`,
			ts.ScriptTarget.Latest,
			true
		);

		console.log(sf);
		debugger;
	}

	test() {
		// iue
		return {
			kind: { graph: true },
			edges: [{ from: "1", to: "2", label: "aa" }],
			nodes: [{ id: "1", label: "uiae" }, { id: "2", label: "bar" }],
		} as CommonDataTypes.GraphData;
	}
}

if (getReloadCount(module) === 0) {
	new Main().run();
}
