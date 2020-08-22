import {
	webviewContract,
	DataExtractionState,
	WindowWithWebviewData,
	WebviewUrlParams,
} from "debug-visualizer/src/webviewContract";
import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { ConsoleRpcLogger } from "@hediet/typed-json-rpc";
import { observable, action, computed, when, runInAction } from "mobx";
import {
	DataExtractorId,
	VisualizationData,
} from "@hediet/debug-visualizer-data-extraction";
import "@hediet/visualization-bundle";
import {
	globalVisualizationFactory,
	VisualizationId,
	Visualization,
} from "@hediet/visualization-core";
import { getApi as getVsCodeApi } from "./VsCodeApi";
import { MonacoBridge } from "./MonacoBridge";
import { Disposable } from "@hediet/std/disposable";
import { startInterval, EventTimer } from "@hediet/std/timer";

declare const window: Window & WindowWithWebviewData;

declare let __webpack_public_path__: string;

export class Model {
	public readonly dispose = Disposable.fn();
	public readonly runningMode: "standalone" | "webview" | "webviewIFrame" =
		"webview";

	@observable
	public theme: "dark" | "light" = "light";

	private port: number;
	private serverSecret: string;

	@observable expression: string = "";
	@observable.ref state:
		| DataExtractionState
		| { kind: "noExpression" }
		| { kind: "visualizationError"; data: VisualizationData } = {
		kind: "noExpression",
	};

	@observable languageId: string = "text";

	@observable private preferredVisualizationId:
		| VisualizationId
		| undefined = undefined;

	@observable isPolling = false;
	private readonly pollingTimer = this.dispose.track(
		new EventTimer(500, "stopped")
	);

	@action
	public setPreferredVisualizationId(id: VisualizationId) {
		this.preferredVisualizationId = id;
	}

	@action
	public setVisualizationError(data: VisualizationData) {
		this.state = { kind: "visualizationError", data: data };
	}

	@action
	public setPolling(value: boolean) {
		this.isPolling = value;
		if (value) {
			this.pollingTimer.start();
		} else {
			this.pollingTimer.stop();
		}
	}

	@computed get visualizations():
		| {
				visualization: Visualization | undefined;
				allVisualizations: Visualization[];
		  }
		| undefined {
		if (this.state.kind === "data") {
			const vis = globalVisualizationFactory.getVisualizations(
				this.state.result.data,
				this.preferredVisualizationId
			);
			return {
				visualization: vis.bestVisualization,
				allVisualizations: vis.allVisualizations,
			};
		} else {
			return undefined;
		}
	}

	@observable.ref
	public server:
		| typeof webviewContract.TServerInterface
		| undefined = undefined;

	private readonly vsCodeApi = getVsCodeApi<{ expression: string }>();

	@observable private _loading = false;

	public get loading(): boolean {
		return this._loading;
	}

	private readonly _bridge = new MonacoBridge(this);

	constructor() {
		if (window.webviewData) {
			const data = window.webviewData;
			this.port = data.serverPort;
			this.serverSecret = data.serverSecret;
			this.runningMode = "webview";
			__webpack_public_path__ = data.publicPath;

			this.theme = window.webviewData.theme;

			if (data.expression !== undefined) {
				this.setExpression(data.expression);
			}
		} else {
			const url = new URL(window.location.href);
			const urlParams = (Object.fromEntries(
				url.searchParams.entries()
			) as unknown) as WebviewUrlParams;
			const portStr = urlParams.serverPort;
			if (!portStr) {
				throw new Error("No port given.");
			}
			this.port = parseInt(portStr);

			const expr = urlParams.expression;
			if (expr) {
				this.setExpression(expr);
			}

			const secret = urlParams.serverSecret;
			if (!secret) {
				throw new Error("Server secret not set.");
			}
			this.serverSecret = secret;

			const theme = urlParams.theme;
			if (theme) {
				this.theme = theme;
			}

			const mode = urlParams.mode;
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

		this.pollingTimer.onTick.sub(() => {
			this.refresh();
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
				const { server } = webviewContract.getServerFromStream(
					stream,
					new ConsoleRpcLogger(),
					{
						updateState: async ({ newState }) => {
							runInAction(() => {
								this._loading = newState.kind === "loading";
								if (!this._loading) {
									this.state = newState;
								}
							});
						},
						setExpression: async ({ expression }) => {
							this.setExpression(expression);
						},
						updateLanguageId: async ({ languageId }) => {
							this.languageId = languageId || "text";
						},
						setTheme: async ({ theme }) => {
							this.theme = theme;
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
