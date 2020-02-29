import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { AddressInfo } from "net";
import WebSocket = require("ws");
import { ConnectionHandler } from "./ConnectionHandler";
import { Sources } from "./DataSource";
import * as express from "express";
import * as http from "http";
import * as serveStatic from "serve-static";
import { Config } from "./Config";
import cryptoRandomString = require("crypto-random-string");
import { distPath } from "debug-visualizer-webview";

export class Server {
	private server: http.Server;
	public readonly secret = cryptoRandomString({ length: 20 });

	constructor(sources: Sources, config: Config) {
		const app = express();

		app.use(serveStatic(distPath));

		this.server = app.listen();

		console.log(
			`Serving "${distPath}" on port ${
				(this.server.address() as AddressInfo).port
			}`
		);

		const wss = new WebSocket.Server({ server: this.server });
		wss.on("connection", ws => {
			const stream = new WebSocketStream(ws);
			new ConnectionHandler(
				sources.dataSource,
				stream,
				this,
				config,
				this.secret
			);
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
