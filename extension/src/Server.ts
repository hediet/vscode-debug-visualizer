import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { AddressInfo } from "net";
import WebSocket = require("ws");
import { ClientConnection } from "./ClientConnection";
import * as express from "express";
import * as http from "http";
import * as serveStatic from "serve-static";
import { Config } from "./Config";
import cryptoRandomString = require("crypto-random-string");
import { distPath } from "debug-visualizer-webview";
import { DataSource } from "./DataSource/DataSource";

export class Server {
	private server: http.Server;
	public readonly secret = cryptoRandomString({ length: 20 });

	public readonly connections = new Set<ClientConnection>();

	constructor(dataSource: DataSource, config: Config) {
		const app = express();

		app.use(serveStatic(distPath));

		this.server = app.listen();

		console.log(
			`Serving "${distPath}" on port ${
				(this.server.address() as AddressInfo).port
			}`
		);

		const wss = new WebSocket.Server({ server: this.server });
		wss.on("connection", async ws => {
			const stream = new WebSocketStream(ws);
			const c = new ClientConnection(
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
	}

	public getIndexUrl(args: {
		expression?: string;
		mode: "standalone" | "webViewIFrame";
	}): string {
		const port = process.env.USE_DEV_UI ? 8080 : this.port;
		const expr =
			args.expression !== undefined
				? `&expression=${encodeURIComponent(args.expression)}`
				: "";
		const inWebView =
			args.mode === "standalone" ? "" : "&mode=webViewIFrame";
		return `http://localhost:${port}/index.html?serverPort=${this.port}&serverSecret=${this.secret}${inWebView}${expr}`;
	}

	public get mainBundleUrl(): string {
		return `http://localhost:${this.port}/main.js`;
	}

	public get port(): number {
		const httpPort = (this.server.address() as AddressInfo).port;
		return httpPort;
	}
}
