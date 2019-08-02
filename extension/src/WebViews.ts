import { window, ViewColumn, WebviewPanel } from "vscode";
import { Server } from "./Server";
import { Disposable } from "@hediet/std/disposable";

export const debugVisualizer = "debugVisualizer";

export class WebViews {
	private readonly debugVisualizations = new Map<WebviewPanel, WebView>();

	public readonly dispose = Disposable.fn();

	constructor(private readonly server: Server) {
		this.dispose.track(
			window.registerWebviewPanelSerializer(debugVisualizer, {
				deserializeWebviewPanel: async (panel, state) => {
					this.restore(panel);
				},
			})
		);

		this.dispose.track({
			dispose: () => {
				for (const panel of this.debugVisualizations.keys()) {
					panel.dispose();
				}
			},
		});
	}

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
}

export class WebView {
	private expression: string | null = null;
	private lastFrameId: number | null = null;

	constructor(private readonly webviewPanel: WebviewPanel) {}
}

export function getHtml(server: Server) {
	const isDev = !!process.env.USE_DEV_UI;
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
