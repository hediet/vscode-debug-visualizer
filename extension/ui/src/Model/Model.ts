import {
	debugVisualizerUIContract,
	DataExtractionState,
} from "@hediet/debug-visualizer-vscode-shared";
import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { ConsoleRpcLogger } from "@hediet/typed-json-rpc";
import { observable, action, computed, when } from "mobx";
import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import { Visualization, VisualizationId } from "../Visualizers/Visualizer";
import { knownVisualizations } from "../Visualizers";
import { getApi as getVsCodeApi } from "./VsCodeApi";
import { MonacoBridge } from "./MonacoBridge";

declare const window: Window & {
	serverPort?: number;
};

export class Model {
	port: number;

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

	private readonly bridge = new MonacoBridge(this);

	constructor() {
		if (window.serverPort) {
			this.port = window.serverPort;
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
					}
				);
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
