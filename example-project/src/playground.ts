import {
	enableHotReload,
	registerUpdateReconciler,
	getReloadCount,
	hotCallExportedFunction,
} from "@hediet/node-reload";

enableHotReload();
registerUpdateReconciler(module);

import { registerDefaultExtractors } from "@hediet/debug-visualizer-data-extraction";
registerDefaultExtractors();

if (getReloadCount(module) === 0) {
	// set interval so that the file watcher can detect changes in other files.
	setInterval(() => {
		hotCallExportedFunction(module, run);
	}, 1000);
}

export function run() {
	new Demo().run();
}

class Demo {
	private f = new Foo(new Foo(undefined));
	private arr = [new Foo(this.f), this.f];
	private set = new Set([this.arr[0], new Foo(new Foo(this.arr[1]))]);

	run() {
		debugger;
	}
}

class Foo {
	constructor(public readonly next: Foo | undefined) {}
}
