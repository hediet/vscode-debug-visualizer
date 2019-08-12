import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { AddressInfo } from "net";
import WebSocket = require("ws");
import { join } from "path";
import { ConnectionHandler } from "./ConnectionHandler";
import { Sources } from "./DataSource";
import * as express from "express";
import * as http from "http";
import * as serveStatic from "serve-static";
import { Config } from "./Config";

export class Server {
	private server: http.Server;

	constructor(sources: Sources, config: Config) {
		const app = express();
		const distPath = join(__dirname, "../ui/dist");
		app.use(serveStatic(distPath));

		this.server = app.listen();

		const wss = new WebSocket.Server({ server: this.server });
		wss.on("connection", ws => {
			const stream = new WebSocketStream(ws);
			new ConnectionHandler(sources, stream, this, config);
		});
	}

	public get indexUrl(): string {
		const port = process.env.USE_DEV_UI ? 8080 : this.port;
		return `http://localhost:${port}/index.html?serverPort=${this.port}`;
	}

	public get mainBundleUrl(): string {
		return `http://localhost:${this.port}/main.js`;
	}

	public get port(): number {
		const httpPort = (this.server.address() as AddressInfo).port;
		return httpPort;
	}
}
