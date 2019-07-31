import {
	window,
	OutputChannel,
	ExtensionContext,
	StatusBarAlignment,
	commands,
	workspace,
	ViewColumn,
	WebviewPanel,
} from "vscode";
import {
	enableHotReload,
	hotRequireExportedFn,
	registerUpdateReconciler,
	getReloadCount,
} from "@hediet/node-reload";
enableHotReload({ entryModule: module });
import { Disposable } from "@hediet/std/disposable";

import { createJsDebuggerSource } from "./DataSource/JsDebuggerSource";
import { debugVisualizerUIContract } from "@hediet/debug-visualizer-vscode-shared";

import { ConsoleRpcLogger } from "@hediet/typed-json-rpc";
import { EvaluationWatcher } from "./DataSource/DataSource";
import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { observable, autorun } from "mobx";
import * as express from "express";
import * as http from "http";
import * as serveStatic from "serve-static";
import { AddressInfo } from "net";
import WebSocket = require("ws");
import { join } from "path";

registerUpdateReconciler(module);

class WebView {
	private expression: string | null = null;
	private lastFrameId: number | null = null;

	constructor(private readonly webviewPanel: WebviewPanel) {}
}

const debugVisualizer = "debugVisualizer";

function getHtml(server: Server) {
	const isDev = true;
	return `
        <html>
            <head>
            <style>
                html { height: 100%; width: 100%; padding: 0; margin: 0; }
                body { height: 100%; width: 100%; padding: 0; margin: 0; }
                iframe { height: 100%; width: 100%; padding: 0; margin: 0; border: 0; display: block; }
            </style>
            </head>
			<body>
				<script>
					window.serverPort = ${server.port};
				</script>
				${
					isDev
						? `<iframe src="http://localhost:8080/?serverPort=${
								server.port
						  }" tabindex="0"></iframe>`
						: `<script type="text/javascript" src="${
								server.mainBundle
						  }"></script>`
				}
            </body>
        </html>
    `;
}

class WebViews {
	private readonly debugVisualizations = new Map<WebviewPanel, WebView>();

	constructor(private readonly server: Server) {}

	public createNew() {
		const panel = window.createWebviewPanel(
			debugVisualizer,
			"Debug Visualizer",
			ViewColumn.Two,
			{ enableScripts: true }
		);

		this.setupView(panel);
	}

	public restore(webviewPanel: WebviewPanel) {
		this.setupView(webviewPanel);
	}

	private setupView(webviewPanel: WebviewPanel) {
		webviewPanel.webview.html = getHtml(this.server);
		const view = new WebView(webviewPanel);
		this.debugVisualizations.set(webviewPanel, view);
		webviewPanel.onDidDispose(() => {
			this.debugVisualizations.delete(webviewPanel);
		});
	}

	public dispose() {
		for (const panel of this.debugVisualizations.keys()) {
			panel.dispose();
		}
	}
}

// js-debug value-printer value-viewer
// #src: bla
// editor-src typescript-ast-viewer

import * as open from "open";

class ConnectionHandler {
	public readonly dispose = Disposable.fn();
	@observable
	private watcher: EvaluationWatcher | undefined = undefined;

	constructor(sources: Sources, stream: WebSocketStream, server: Server) {
		const {
			client,
			channel,
		} = debugVisualizerUIContract.registerServerToStream(
			stream,
			new ConsoleRpcLogger(),
			{
				refresh: async () => {
					if (this.watcher) {
						this.watcher.refresh();
					}
				},
				setExpression: async ({ newExpression }) => {
					if (this.watcher) {
						this.dispose.untrack(this.watcher).dispose();
					}
					this.watcher = this.dispose.track(
						sources.jsSource.createEvaluationWatcher(newExpression)
					);
				},
				openInBrowser: async ({}) => {
					open(server.indexUrl);
				},
			}
		);

		this.dispose.track(
			Disposable.create(
				autorun(() => {
					if (this.watcher) {
						client.updateState({
							newState: this.watcher.state,
						});
					}
				})
			)
		);

		stream.onClosed.then(() => {
			this.dispose();
		});
	}
}

class Server {
	private server: http.Server;

	constructor(sources: Sources) {
		const app = express();
		app.use(serveStatic(join(__dirname, "../../ui/dist")));

		this.server = app.listen();

		const wss = new WebSocket.Server({ server: this.server });
		wss.on("connection", ws => {
			const stream = new WebSocketStream(ws);
			new ConnectionHandler(sources, stream, this);
		});
		console.log(this.port);
	}

	public get indexUrl(): string {
		return `http://localhost:${this.port}/index.html?serverPort=${
			this.port
		}`;
	}

	public get mainBundle(): string {
		return `http://localhost:${this.port}/main-efe6bdc4b62fdc7971ee.js`;
	}

	public get port(): number {
		const httpPort = (this.server.address() as AddressInfo).port;
		return httpPort;
	}
}

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
