import { Disposable } from "@hediet/std/disposable";
import { debugVisualizerUIContract } from "@hediet/debug-visualizer-vscode-shared";
import { ConsoleRpcLogger, RequestHandlingError } from "@hediet/typed-json-rpc";
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
		config: Config,
		serverSecret: string
	) {
		let authenticated = false;

		function throwIfNotAuthenticated() {
			if (!authenticated) {
				throw new RequestHandlingError("Not authenticated");
			}
		}

		const {
			client,
			channel,
		} = debugVisualizerUIContract.registerServerToStream(
			stream,
			new ConsoleRpcLogger(),
			{
				authenticate: async ({ secret }, { newErr }) => {
					if (secret !== serverSecret) {
						return newErr({ errorMessage: "Invalid Secret" });
					} else {
						authenticated = true;
					}
				},
				refresh: async () => {
					throwIfNotAuthenticated();

					if (this.watcher) {
						this.watcher.refresh();
					}
				},
				setExpression: async ({ newExpression }) => {
					throwIfNotAuthenticated();

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
					throwIfNotAuthenticated();

					let opened = false;
					if (config.useChromeKioskMode()) {
						opened = await launchChrome(server.indexUrl);
					}
					if (!opened) {
						open(server.indexUrl);
					}
				},
				setPreferredDataExtractor: async ({ dataExtractorId }) => {
					throwIfNotAuthenticated();

					if (this.watcher) {
						this.watcher.setPreferredDataExtractor(dataExtractorId);
					}
				},
				getCompletions: async ({ text, column }) => {
					throwIfNotAuthenticated();

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
