import {
	debugVisualizerUIContract,
	DataExtractionState,
} from "@hediet/debug-visualizer-vscode-shared";
import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { ConsoleRpcLogger } from "@hediet/typed-json-rpc";
import { observable, action, computed } from "mobx";
import { Barrier } from "@hediet/std/synchronization";
import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import { Visualization, VisualizationId } from "./Visualizers/Visualizer";
import { knownVisualizations } from "./Visualizers";

declare const window: Window & {
	serverPort?: number;
};

interface VSCodeApi<TState> {
	getState(): Promise<TState | undefined>;
	setState(state: TState): Promise<void>;
}

type IncomingCommand = {
	command: "getStateResult";
	state: unknown;
};

type OutgoingCommand =
	| {
			command: "setState";
			state: unknown;
	  }
	| { command: "getState" };

class IFrameVSCodeApi<TState> implements VSCodeApi<TState> {
	private currentGetStatePromise: Barrier<TState> | undefined = undefined;

	constructor() {
		window.addEventListener("message", event => {
			const data = event.data as IncomingCommand;
			if (data.command === "getStateResult") {
				this.currentGetStatePromise!.unlock(data.state as any);
			}
		});
	}

	private sendCommand(command: OutgoingCommand) {
		window.parent.postMessage(command, "*");
	}

	getState(): Promise<TState | undefined> {
		this.sendCommand({ command: "getState" });
		if (this.currentGetStatePromise) {
			throw new Error("Get state already in progress.");
		}
		this.currentGetStatePromise = new Barrier();
		return this.currentGetStatePromise.onUnlocked;
	}

	async setState(state: TState): Promise<void> {
		this.sendCommand({ command: "setState", state });
	}
}

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

	private server:
		| typeof debugVisualizerUIContract.TServerInterface
		| undefined = undefined;

	private readonly vsCodeApi = new IFrameVSCodeApi<{ expression: string }>();

	@observable private _loading = false;

	public get loading(): boolean {
		return this._loading;
	}

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
		if (this.server) {
			this.server.setExpression({ newExpression });
		}

		this.vsCodeApi.setState({
			expression: newExpression,
		});
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
						updateState: ({ newState }) => {
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
