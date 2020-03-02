import { window, ExtensionContext, commands } from "vscode";
import { Disposable } from "@hediet/std/disposable";
import {
	enableHotReload,
	hotRequireExportedFn,
	registerUpdateReconciler,
	getReloadCount,
} from "@hediet/node-reload";

if (process.env.HOT_RELOAD) {
	enableHotReload({ entryModule: module, loggingEnabled: true });
}
registerUpdateReconciler(module);

import { WebViews } from "./WebViews";
import { Server } from "./Server";
import { Config } from "./Config";
import { VsCodeDebugger, VsCodeDebuggerView } from "./VsCodeDebugger";
import { DataSourceImpl } from "./DataSource";
import {
	ComposedDataExtractionProviderFactory,
	JsDataExtractionProviderFactory,
	GenericDataExtractionProviderFactory,
	ConfiguredDataExtractionProviderFactory,
} from "./DataSource/DataExtractionProvider";

export class Extension {
	public readonly dispose = Disposable.fn();

	private readonly config = new Config();

	private readonly debugger = this.dispose.track(new VsCodeDebugger());
	private readonly debuggerView = this.dispose.track(
		new VsCodeDebuggerView(this.debugger)
	);

	public readonly dataSource = new DataSourceImpl(
		this.debuggerView,
		new ComposedDataExtractionProviderFactory([
			new ConfiguredDataExtractionProviderFactory(this.config),
			new JsDataExtractionProviderFactory(),
			new GenericDataExtractionProviderFactory(),
		])
	);

	private readonly server = new Server(this.dataSource, this.config);
	private readonly views = this.dispose.track(new WebViews(this.server));

	constructor() {
		if (getReloadCount(module) > 0) {
			const i = this.dispose.track(window.createStatusBarItem());
			i.text = "reload" + getReloadCount(module);
			i.show();
		}

		this.dispose.track(
			commands.registerCommand(
				"vscode-debug-visualizer.new-visualizer",
				() => {
					this.views.createNew();
				}
			)
		);
	}
}

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		hotRequireExportedFn(module, Extension, Extension => new Extension())
	);
}

export function deactivate() {}
