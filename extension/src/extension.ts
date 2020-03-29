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
import { EvaluationWatchServiceImpl } from "./EvaluationWatchService";
import {
	ComposedEvaluationEngine,
	JsEvaluationEngine,
	GenericEvaluationEngine,
	ConfiguredEvaluationEngine,
} from "./EvaluationWatchService/EvaluationEngine";

export class Extension {
	public readonly dispose = Disposable.fn();

	private readonly config = new Config();

	private readonly debugger = this.dispose.track(new VsCodeDebugger());
	private readonly debuggerView = this.dispose.track(
		new VsCodeDebuggerView(this.debugger)
	);

	public readonly dataSource = new EvaluationWatchServiceImpl(
		this.debuggerView,
		new ComposedEvaluationEngine([
			new ConfiguredEvaluationEngine(this.config),
			new JsEvaluationEngine(),
			new GenericEvaluationEngine(),
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

		this.dispose.track(
			commands.registerCommand(
				"vscode-debug-visualizer.visualizer-set-expression",
				() => {
					const editor = window.activeTextEditor;
					if (!editor) {
						return;
					}

					const selection = editor.selection;
					const selectedText = editor.document.getText(selection);

					if (!selectedText) {
						return;
					}

					const connections = [...this.server.connections.values()];
					if (connections.length > 0) {
						const latestConnection =
							connections[connections.length - 1];

						latestConnection.setExpression(selectedText);
					} else {
						this.views.createNew(selectedText);
					}
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
