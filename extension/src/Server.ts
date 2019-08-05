import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { AddressInfo } from "net";
import WebSocket = require("ws");
import { join } from "path";
import { ConnectionHandler } from "./ConnectionHandler";
import { Sources } from "./extension";
import * as express from "express";
import * as http from "http";
import * as serveStatic from "serve-static";

export class Server {
	private server: http.Server;

	constructor(sources: Sources) {
		const app = express();
		app.use(serveStatic(join(__dirname, "../ui/dist")));

		this.server = app.listen();

		const wss = new WebSocket.Server({ server: this.server });
		wss.on("connection", ws => {
			const stream = new WebSocketStream(ws);
			new ConnectionHandler(sources, stream, this);
		});
		console.log(this.port);
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
