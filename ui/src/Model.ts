import {
	debugVisualizerUIContract,
	DataExtractionState,
} from "@hediet/debug-visualizer-vscode-shared";
import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { ConsoleRpcLogger } from "@hediet/typed-json-rpc";
import { observable, action } from "mobx";

declare const window: Window & {
	serverPort?: number;
};

export class Model {
	port: number;

	@observable expression: string = "";
	@observable state: DataExtractionState | { kind: "noExpression" } = {
		kind: "noExpression",
	};

	private server:
		| typeof debugVisualizerUIContract.TServerInterface
		| undefined = undefined;

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
	}

	@action
	setExpression(newExpression: string) {
		this.expression = newExpression;
		if (this.server) {
			this.server.setExpression({ newExpression });
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
							this.state = newState;
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
