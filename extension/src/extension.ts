import { window, ExtensionContext, commands, languages } from "vscode";
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

import { InternalWebviewManager } from "./webview/InternalWebviewManager";
import { WebviewServer } from "./webview/WebviewServer";
import { Config } from "./Config";
import { DebuggerProxy } from "./proxies/DebuggerProxy";
import { DebuggerViewProxy, FrameIdGetter } from "./proxies/DebuggerViewProxy";
import { VisualizationWatchModelImpl } from "./VisualizationWatchModel";
import {
	ComposedVisualizationSupport,
	JsEvaluationEngine,
	PyEvaluationEngine,
	RbEvaluationEngine,
	GenericVisualizationSupport,
	ConfigurableVisualizationSupport,
} from "./VisualizationBackend";
import { DispatchingVisualizationBackend } from "./VisualizationBackend/DispatchingVisualizationBackend";

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		hotRequireExportedFn(module, Extension, Extension => new Extension())
	);
}

export function deactivate() { }

export class Extension {
	public readonly dispose = Disposable.fn();

	private readonly config = new Config();
	private readonly debugger = this.dispose.track(new DebuggerProxy());
	private readonly debuggerView = this.dispose.track(
		new DebuggerViewProxy(this.debugger)
	);

	constructor() {
		const frameIdGetter = new FrameIdGetter();

		this.dispose.track(
			languages.registerInlineValuesProvider("*", frameIdGetter)
		);

		const dataSource = new VisualizationWatchModelImpl(
			new DispatchingVisualizationBackend(
				new ComposedVisualizationSupport([
					new ConfigurableVisualizationSupport(
						this.config,
						this.debuggerView,
						frameIdGetter
					),
					new JsEvaluationEngine(this.debuggerView, this.config, frameIdGetter),
					new PyEvaluationEngine(this.debuggerView, this.config, frameIdGetter),
					new RbEvaluationEngine(this.debuggerView, this.config, frameIdGetter),
					new GenericVisualizationSupport(this.debuggerView, frameIdGetter),
				]),
				this.debuggerView
			)
		);

		const server = new WebviewServer(dataSource, this.config);

		const views = this.dispose.track(
			new InternalWebviewManager(server, this.config)
		);

		if (getReloadCount(module) > 0) {
			const i = this.dispose.track(window.createStatusBarItem());
			i.text = "reload" + getReloadCount(module);
			i.show();
		}

		this.dispose.track(
			commands.registerCommand(
				"vscode-debug-visualizer.new-visualizer",
				() => {
					views.createNew();
				}
			)
		);

		this.dispose.track(
			commands.registerCommand(
				"vscode-debug-visualizer.visualizer-set-expression",
				() => {
					const editor = window.activeTextEditor;
					if (!editor) {
						return;
					}

					const selection = editor.selection;

					let selectedText;
					if (selection.isEmpty) {
						const lineText = editor.document.lineAt(selection.start)
							.text;
						const regexp = /`(.*)`/g;
						selectedText = "";
						let match;
						while ((match = regexp.exec(lineText))) {
							if (
								match.index <= selection.start.character &&
								selection.start.character <=
								match.index + match[0].length
							) {
								selectedText = match[1];
							}
						}
					} else {
						selectedText = editor.document.getText(selection);
					}

					if (!selectedText) {
						return;
					}

					const connections = [...server.connections.values()];
					const latestConnection =
						connections[connections.length - 1];

					if (latestConnection) {
						latestConnection.setExpression(selectedText);
					} else {
						views.createNew(selectedText);
					}
				}
			)
		);
	}
}
