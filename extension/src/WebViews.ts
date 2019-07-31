import { window, ViewColumn, WebviewPanel } from "vscode";
import { Server } from "./Server";

export const debugVisualizer = "debugVisualizer";

export class WebViews {
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

export class WebView {
	private expression: string | null = null;
	private lastFrameId: number | null = null;

	constructor(private readonly webviewPanel: WebviewPanel) {}
}

export function getHtml(server: Server) {
	const isDev = false;
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
