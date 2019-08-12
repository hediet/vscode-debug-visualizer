import { Disposable } from "@hediet/std/disposable";
import { debugVisualizerUIContract } from "@hediet/debug-visualizer-vscode-shared";
import { ConsoleRpcLogger } from "@hediet/typed-json-rpc";
import { EvaluationWatcher } from "./DataSource/DataSource";
import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { observable, autorun } from "mobx";
import { Sources } from "./DataSource";
import { Server } from "./Server";
import * as open from "open";
import chromeLauncher = require("chrome-launcher");
import { Config } from "./Config";

export class ConnectionHandler {
	public readonly dispose = Disposable.fn();
	@observable
	private watcher: EvaluationWatcher | undefined = undefined;

	constructor(
		sources: Sources,
		stream: WebSocketStream,
		server: Server,
		config: Config
	) {
		const {
			client,
			channel,
		} = debugVisualizerUIContract.registerServerToStream(
			stream,
			new ConsoleRpcLogger(),
			{
				refresh: async () => {
					if (this.watcher) {
						this.watcher.refresh();
					}
				},
				setExpression: async ({ newExpression }) => {
					let oldPreferredDataExtractor: EvaluationWatcher["preferredDataExtractor"];
					if (this.watcher) {
						oldPreferredDataExtractor = this.watcher
							.preferredDataExtractor;
						this.dispose.untrack(this.watcher).dispose();
					}
					this.watcher = this.dispose.track(
						sources.jsSource.createEvaluationWatcher(
							newExpression,
							{
								preferredDataExtractor: oldPreferredDataExtractor,
							}
						)
					);
				},
				openInBrowser: async ({}) => {
					let opened = false;
					if (config.useChromeKioskMode()) {
						opened = await launchChrome(server.indexUrl);
					}
					if (!opened) {
						open(server.indexUrl);
					}
				},
				setPreferredDataExtractor: async ({ dataExtractorId }) => {
					if (this.watcher) {
						this.watcher.setPreferredDataExtractor(dataExtractorId);
					}
				},
				getCompletions: async ({ text, column }) => {
					const completions = await sources.jsSource.getCompletions(
						text,
						column
					);
					return {
						completions,
					};
				},
			}
		);

		this.dispose.track(
			Disposable.create(
				autorun(() => {
					if (this.watcher) {
						client.updateState({
							newState: this.watcher.state,
						});
					}
				})
			)
		);

		stream.onClosed.then(() => {
			this.dispose();
		});
	}
}

async function launchChrome(url: string): Promise<boolean> {
	try {
		const _chrome = await chromeLauncher.launch({
			startingUrl: url,
			// `--window-size=${width},${height}`
			chromeFlags: ["--app=" + url],
		});
		return true;
	} catch (e) {
		return false;
	}
}
