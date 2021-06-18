import { Disposable } from "@hediet/std/disposable";
import { webviewContract } from "../webviewContract";
import { ConsoleRpcLogger, RequestHandlingError } from "@hediet/typed-json-rpc";
import {
	VisualizationWatch,
	VisualizationWatchModel,
} from "../VisualizationWatchModel";
import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { observable, autorun } from "mobx";
import { WebviewServer } from "./WebviewServer";
import * as open from "open";
import chromeLauncher = require("chrome-launcher");
import { Config } from "../Config";

export class WebviewConnection {
	public readonly dispose = Disposable.fn();
	@observable
	private watcher: VisualizationWatch | undefined = undefined;

	private readonly client: typeof webviewContract["TClientInterface"];

	constructor(
		evaluationWatchService: VisualizationWatchModel,
		stream: WebSocketStream,
		server: WebviewServer,
		config: Config,
		serverSecret: string
	) {
		let authenticated = false;

		function throwIfNotAuthenticated() {
			if (!authenticated) {
				throw new RequestHandlingError("Not authenticated");
			}
		}

		const { client, channel } = webviewContract.registerServerToStream(
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

					let oldPreferredDataExtractor: VisualizationWatch["preferredDataExtractor"];
					if (this.watcher) {
						oldPreferredDataExtractor = this.watcher
							.preferredDataExtractor;
						this.dispose.untrack(this.watcher).dispose();
					}
					this.watcher = this.dispose.track(
						evaluationWatchService.createWatch(newExpression, {
							preferredDataExtractor: oldPreferredDataExtractor,
						})
					);
				},
				openInBrowser: async ({}) => {
					throwIfNotAuthenticated();

					const url = server.getWebviewPageUrl({
						mode: "standalone",
						expression: this.watcher
							? this.watcher.expression
							: undefined,
					});

					let opened = false;
					if (config.useChromeKioskMode) {
						opened = await launchChrome(url);
					}
					if (!opened) {
						open(url);
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

					const completions = await evaluationWatchService.getCompletions(
						text,
						column
					);
					return {
						completions,
					};
				},
			}
		);

		this.client = client;

		this.dispose.track([
			Disposable.create(
				autorun(() => {
					if (this.watcher) {
						client.updateState({
							newState: this.watcher.state,
						});
					}
				})
			),
			Disposable.create(
				autorun(() => {
					client.updateLanguageId({
						languageId: evaluationWatchService.languageId || null,
					});
				})
			),
		]);

		stream.onClosed.then(() => {
			this.dispose();
		});
	}

	public setExpression(expression: string) {
		this.client.setExpression({ expression });
	}

	public setTheme(theme: "light" | "dark"): void {
		this.client.setTheme({ theme });
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
