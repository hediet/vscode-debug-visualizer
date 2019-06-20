import * as vscode from 'vscode';

const debugVisualizer = "debugVisualizer";

function getHtml() {
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
                <iframe src="http://localhost:8080/"></iframe>
                <script>
                const api = acquireVsCodeApi();
                window.addEventListener('message', event => {
                    if (event.source === window.frames[0]) {
                        if (event.data.command === "setExpression") {
                            api.setState({ expression: event.data.expression });
                        }

                        if (event.data.command === "initialized") {
                            console.log("initialized, sent ", api.getState());
                            window.frames[0].postMessage({ command: "setExpression", expression: api.getState().expression }, "*");
                            
                        } else {
                            console.log("iframe -> vscode", event.data);
                            api.postMessage(event.data);
                        }
                    } else {
                        console.log("vscode -> iframe", event.data);
                        window.frames[0].postMessage(event.data, "*");
                    }
                });
                </script>
            </body>
        </html>
    `;
}

class DebugVisualizerViewSerializer implements vscode.WebviewPanelSerializer {
    constructor(private readonly views: WebViews) {}

	async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
	    this.views.restore(webviewPanel);
	}
}

class WebView {
    private expression: string|null = null;
    private lastFrameId: number|null = null;

    constructor(private readonly webviewPanel: vscode.WebviewPanel) {
        webviewPanel.webview.onDidReceiveMessage(e => {
            if (e.command === "setExpression") {
                this.expression = e.expression;
                if (this.lastFrameId) {
                    this.reevaluateExpression(this.lastFrameId);
                }
            }
        });
    }

    public getExpression(): string|null {
        return this.expression;
    }

    public async reevaluateExpression(frameId: number) {
        this.lastFrameId = frameId;
        if (!this.expression) { return; }

        const session = vscode.debug.activeDebugSession;
        if (session) {
            try {
                const reply = await session.customRequest("evaluate", { "expression": this.expression, frameId, context: "watch" });
                this.webviewPanel.webview.postMessage({
                    command: "setValue",
                    value: { data: reply.result }
                });
            }
            catch (error) {
                vscode.window.showInformationMessage(`error: ${error.message}`);
            }
        }
    }
}

class WebViews {
    private readonly debugVisualizations = new Map<vscode.WebviewPanel, WebView>();

    public createNew() {
        const panel = vscode.window.createWebviewPanel(
            debugVisualizer,
            'Debug Visualizer',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        this.setupView(panel);
    }

    public restore(webviewPanel: vscode.WebviewPanel) {
        this.setupView(webviewPanel);
    }

    private setupView(webviewPanel: vscode.WebviewPanel) {
        webviewPanel.webview.html = getHtml();
        const view = new WebView(webviewPanel);
        this.debugVisualizations.set(webviewPanel, view);
        webviewPanel.onDidDispose(() => {
            this.debugVisualizations.delete(webviewPanel);
        });
    }

    public reevaluateExpressions(frameId: number) {
        for (const vis of this.debugVisualizations.values()) {
            vis.reevaluateExpression(frameId);
        }
    }
}


export function activate(context: vscode.ExtensionContext) {
    const views = new WebViews();

    vscode.debug.onDidReceiveDebugSessionCustomEvent(e => {
        if (e.event === "paused") {
            const frameId = e.body.currentFrameId;
            views.reevaluateExpressions(frameId);
        }
    })

    vscode.window.registerWebviewPanelSerializer(debugVisualizer,
        new DebugVisualizerViewSerializer(views));

    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        views.createNew();
        //const session = vscode.debug.activeDebugSession;

        /*
        if (session) {
            session.customRequest("evaluate", { "expression": "Math.sqrt(10)" }).then(reply => {
                vscode.window.showInformationMessage(`result: ${reply.result}`);
            }, error => {
                vscode.window.showInformationMessage(`error: ${error.message}`);
            });
        }*/
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}