import { window, ExtensionContext, WebviewPanel } from "vscode";
import {
	enableHotReload,
	hotRequireExportedFn,
	registerUpdateReconciler,
	getReloadCount,
} from "@hediet/node-reload";
enableHotReload({ entryModule: module, loggingEnabled: true });
import { Disposable } from "@hediet/std/disposable";

import { createJsDebuggerSource } from "./DataSource/JsDebuggerSource";

import { WebViews } from "./WebViews";
import { Server } from "./Server";

registerUpdateReconciler(module);

export class Sources {
	public readonly jsSource = createJsDebuggerSource();
}

export class Extension {
	public dispose = Disposable.fn();

	private readonly sources = new Sources();
	private readonly server = new Server(this.sources);
	private readonly views = this.dispose.track(new WebViews(this.server));

	constructor() {
		const i = this.dispose.track(window.createStatusBarItem());
		i.text = "reload" + getReloadCount(module);
		i.show();
		this.views.createNew();
	}
}

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		hotRequireExportedFn(module, Extension, Extension => new Extension())
	);
}

export function deactivate() {}
