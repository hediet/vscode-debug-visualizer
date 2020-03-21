import {
	debugVisualizerUIContract,
	DataExtractionState,
} from "debug-visualizer/src/contract";
import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { ConsoleRpcLogger } from "@hediet/typed-json-rpc";
import { observable, action, computed, when } from "mobx";
import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import {
	Visualization,
	VisualizationId,
	knownVisualizations,
} from "@hediet/visualization";
import { getApi as getVsCodeApi } from "./VsCodeApi";
import { MonacoBridge } from "./MonacoBridge";
import { Disposable } from "@hediet/std/disposable";
import { startInterval } from "@hediet/std/timer";

declare const window: Window & {
	webViewData?: {
		serverSecret: string;
		serverPort: number;
		publicPath: string;
	};
};

declare let __webpack_public_path__: string;

export class Model {
	public readonly dispose = Disposable.fn();
	public readonly runningMode: "standalone" | "webView" | "webViewIFrame" =
		"webView";

	@observable
	public theme: "dark" | "light" = "light";

	private port: number;
	private serverSecret: string;

	@observable expression: string = "";
	@observable state: DataExtractionState | { kind: "noExpression" } = {
		kind: "noExpression",
	};

	@observable private preferredVisualizationId:
		| VisualizationId
		| undefined = undefined;

	@action
	public setPreferredVisualizationId(id: VisualizationId) {
		this.preferredVisualizationId = id;
	}

	@computed get visualizations():
		| {
				visualization: Visualization | undefined;
				allVisualizations: Visualization[];
		  }
		| undefined {
		if (this.state.kind === "data") {
			const vis = knownVisualizations.getBestVisualization(
				this.state.result.data,
				this.preferredVisualizationId
			);
			return vis;
		} else {
			return undefined;
		}
	}

	@observable.ref
	public server:
		| typeof debugVisualizerUIContract.TServerInterface
		| undefined = undefined;

	private readonly vsCodeApi = getVsCodeApi<{ expression: string }>();

	@observable private _loading = false;

	public get loading(): boolean {
		return this._loading;
	}

	private readonly _bridge = new MonacoBridge(this);

	constructor() {
		if (window.webViewData) {
			const data = window.webViewData;
			this.port = data.serverPort;
			this.serverSecret = data.serverSecret;
			this.runningMode = "webView";
			__webpack_public_path__ = data.publicPath;

			const updateTheme = () => {
				const isLight = document.body.classList.contains(
					"vscode-light"
				);
				this.theme = isLight ? "light" : "dark";
			};
			updateTheme();

			this.dispose.track(
				startInterval(1000, () => {
					updateTheme();
				})
			);
		} else {
			const url = new URL(window.location.href);
			const portStr = url.searchParams.get("serverPort");
			if (!portStr) {
				throw new Error("No port given.");
			}
			this.port = parseInt(portStr);

			const expr = url.searchParams.get("expression");
			if (expr) {
				this.setExpression(expr);
			}

			const secret = url.searchParams.get("serverSecret");
			if (!secret) {
				throw new Error("Server secret not set.");
			}
			this.serverSecret = secret;

			const theme = url.searchParams.get("theme");
			if (theme && theme === "dark") {
				this.theme = "dark";
			} else {
				this.theme = "light";
			}

			const mode = url.searchParams.get("mode");
			if (mode) {
				this.runningMode = mode as any;
			} else {
				this.runningMode = "standalone";
			}
		}

		this.stayConnected();

		this.vsCodeApi.getState().then(state => {
			if (state) {
				this.setExpression(state.expression);
			}
		});
	}

	@action
	setExpression(newExpression: string) {
		this.expression = newExpression;
		when(() => !!this.server).then(() => {
			this.server!.setExpression({ newExpression });
		});

		this.vsCodeApi.setState({
			expression: newExpression,
		});

		const url = new URL(window.location.href);
		url.searchParams.set("expression", newExpression);
		history.replaceState(null, document.title, url.toString());
	}

	setPreferredExtractorId(id: DataExtractorId) {
		if (this.server) {
			this.server.setPreferredDataExtractor({
				dataExtractorId: id,
			});
		}
	}

	refresh() {
		if (this.server) {
			this.server.refresh();
		}
	}

	async stayConnected(): Promise<void> {
		while (true) {
			try {
				const stream = await WebSocketStream.connectTo({
					host: "localhost",
					port: this.port,
				});
				const {
					server,
				} = debugVisualizerUIContract.getServerFromStream(
					stream,
					new ConsoleRpcLogger(),
					{
						updateState: async ({ newState }) => {
							this._loading = newState.kind === "loading";
							if (!this._loading) {
								this.state = newState;
							}
						},
						setExpression: async ({ expression }) => {
							this.setExpression(expression);
						},
					}
				);
				try {
					await server.authenticate({ secret: this.serverSecret });
				} catch (e) {
					console.error(e);
				}
				this.server = server;

				await stream.onClosed;
			} catch (e) {}
		}
	}

	openBrowser() {
		if (this.server) {
			this.server.openInBrowser();
		}
	}

	useSelectionAsExpression() {
		throw new Error("Method not implemented.");
	}
}
