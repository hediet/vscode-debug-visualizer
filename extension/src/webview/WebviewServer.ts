import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { AddressInfo } from "net";
import WebSocket = require("ws");
import { WebviewConnection } from "./WebviewConnection";
import * as express from "express";
import * as http from "http";
import * as serveStatic from "serve-static";
import { Config } from "../Config";
import cryptoRandomString = require("crypto-random-string");
import { distPath } from "debug-visualizer-webview";
import { VisualizationWatchModel } from "../VisualizationWatchModel/VisualizationWatchModel";
import { URLSearchParams } from "url";
import { autorun, reaction } from "mobx";

export class WebviewServer {
	private readonly server: http.Server;
	public readonly secret = cryptoRandomString({ length: 30 });

	public readonly connections = new Set<WebviewConnection>();

	constructor(
		dataSource: VisualizationWatchModel,
		private readonly config: Config
	) {
		const app = express();

		app.use(serveStatic(distPath));

		this.server = app.listen();

		/*
		console.log(
			`Serving "${distPath}" on port ${
				(this.server.address() as AddressInfo).port
			}`
		);
		*/

		const wss = new WebSocket.Server({ server: this.server });
		wss.on("connection", async ws => {
			const stream = new WebSocketStream(ws);
			const c = new WebviewConnection(
				dataSource,
				stream,
				this,
				config,
				this.secret
			);
			this.connections.add(c);
			await stream.onClosed;
			this.connections.delete(c);
		});

		reaction(
			() => config.theme,
			theme => {
				for (const c of this.connections) {
					c.setTheme(theme);
				}
			}
		);
	}

	public getWebviewPageUrl(args: {
		expression?: string;
		mode: "standalone" | "webviewIFrame";
	}): string {
		const port = process.env.USE_DEV_UI ? 8080 : this.port;
		const params: Record<string, string> = {
			serverPort: this.port.toString(),
			serverSecret: this.secret,
			mode: args.mode,
			theme: this.config.theme,
		};
		if (args.expression !== undefined) {
			params.expression = args.expression;
		}

		return `http://localhost:${port}/index.html?${new URLSearchParams(
			params
		).toString()}`;
	}

	public get publicPath(): string {
		return `http://localhost:${this.port}/`;
	}

	public get webviewBundleUrl(): string {
		return `${this.publicPath}main.js`;
	}

	public get port(): number {
		const httpPort = (this.server.address() as AddressInfo).port;
		return httpPort;
	}
}
