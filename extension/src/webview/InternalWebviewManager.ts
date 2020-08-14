import { window, ViewColumn, WebviewPanel } from "vscode";
import { WebviewServer } from "./WebviewServer";
import { Disposable } from "@hediet/std/disposable";
import { WindowWithWebviewData } from "../webviewContract";
import { Config } from "../Config";

export const debugVisualizer = "debugVisualizer";

export class InternalWebviewManager {
	private readonly openedWebviews = new Map<
		WebviewPanel,
		DebugVisualizerWebview
	>();

	public readonly dispose = Disposable.fn();

	constructor(
		private readonly server: WebviewServer,
		private readonly config: Config
	) {
		this.dispose.track(
			window.registerWebviewPanelSerializer(debugVisualizer, {
				deserializeWebviewPanel: async (panel, state) => {
					this.restore(panel);
				},
			})
		);

		this.dispose.track({
			dispose: () => {
				for (const panel of this.openedWebviews.keys()) {
					panel.dispose();
				}
			},
		});
	}

	public createNew(expression: string | undefined = undefined) {
		const webviewPanel = window.createWebviewPanel(
			debugVisualizer,
			"Debug Visualizer",
			ViewColumn.Two,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				portMapping: [
					{
						webviewPort: this.server.port,
						extensionHostPort: this.server.port,
					},
				],
			}
		);

		this.initializeView(webviewPanel, expression);
	}

	private restore(webviewPanel: WebviewPanel) {
		this.initializeView(webviewPanel);
	}

	private initializeView(
		webviewPanel: WebviewPanel,
		expression: string | undefined = undefined
	) {
		webviewPanel.webview.html = getDebugVisualizerWebviewHtml(
			this.server,
			expression,
			this.config
		);
		const view = new DebugVisualizerWebview(webviewPanel);
		this.openedWebviews.set(webviewPanel, view);
		webviewPanel.onDidDispose(() => {
			this.openedWebviews.delete(webviewPanel);
		});
	}
}

export class DebugVisualizerWebview {
	constructor(private readonly webviewPanel: WebviewPanel) {}
}

function getDebugVisualizerWebviewHtml(
	server: WebviewServer,
	initialExpression: string | undefined = undefined,
	config: Config
) {
	const isDev = !!process.env.USE_DEV_UI;
	return `
        <html>
			<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline'; worker-src * data: 'unsafe-inline' 'unsafe-eval'; font-src * 'unsafe-inline' 'unsafe-eval';">
            <style>
                html { height: 100%; width: 100%; padding: 0; margin: 0; }
                body { height: 100%; width: 100%; padding: 0; margin: 0; }
                iframe { height: 100%; width: 100%; padding: 0; margin: 0; border: 0; display: block; }
            </style>
            </head>
			<body>
				<script>
					Object.assign(window, ${JSON.stringify({
						webviewData: {
							serverSecret: server.secret,
							serverPort: server.port,
							publicPath: server.publicPath,
							expression: initialExpression,
							theme: config.theme,
						},
					} as WindowWithWebviewData)});
					const api = window.VsCodeApi = acquireVsCodeApi();
					window.addEventListener('message', event => {
						if (event.source === window.frames[0]) {
							if (event.data.command === "setState") {
								console.log("setState", event.data.state);
								api.setState(event.data.state);
							}
							if (event.data.command === "getState") {
								console.log("getState, sent ", api.getState());
								window.frames[0].postMessage({ command: "getStateResult", state: api.getState() }, "*");
							}
						}
					});
				</script>
				
				${
					isDev
						? `<iframe sandbox="allow-top-navigation allow-scripts allow-same-origin allow-popups allow-pointer-lock allow-forms" src="${server.getWebviewPageUrl(
								{
									mode: "webviewIFrame",
									expression: initialExpression,
								}
						  )}"></iframe>`
						: `<script type="text/javascript" src="${server.webviewBundleUrl}"></script>`
				}
            </body>
        </html>
    `;
}
