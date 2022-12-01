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
import { IncrementalMap } from "../utils/IncrementalMap";
import { watch, existsSync, readFileSync } from "fs";
import { DebouncedRunner } from "../utils/DebouncedRunner";
import { getExpressionForDataExtractorApi } from "@hediet/debug-visualizer-data-extraction";
import { window } from "vscode";

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
						oldPreferredDataExtractor =
							this.watcher.preferredDataExtractor;
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

					const completions =
						await evaluationWatchService.getCompletions(
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

		this.dispose.track(
			new FileWatcher(
				() => config.customVisualizerScriptPaths,
				async (files) => {
					for (const file of files) {
						if (!file.fileExists) {
							window.showErrorMessage(
								`The file ${file.path} does not exist.`
							);
							continue;
						}

						try {
							await client.setCustomVisualizerScript({
								id: file.path,
								jsSource: file.content || null,
							});
						} catch (e) {
							window.showErrorMessage(
								'Error while running custom visualization extractor script "' +
									file.path +
									'": ' +
									e.message
							);
						}
					}
				}
			)
		);

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

export class FileWatcher {
	public readonly dispose = Disposable.fn();

	constructor(
		getFilePaths: () => string[],
		handleFileContents: (
			files: {
				path: string;
				fileExists: boolean;
				content: string | undefined;
			}[]
		) => void
	) {
		const scheduleRefresh = new Set<SingleFileWatcher>();
		const debouncer = new DebouncedRunner(200);

		const map = this.dispose.track(
			new IncrementalMap(
				getFilePaths,
				(path) =>
					new SingleFileWatcher(path, (w) => {
						scheduleRefresh.add(w);
						debouncer.run(() => {
							const changedWatchers = [...scheduleRefresh].filter(
								(w) => w.refresh()
							);
							handleFileContents(
								changedWatchers.map((w) => ({
									path: w.path,
									content: w.content,
									fileExists: w.exists,
								}))
							);
						});
					})
			)
		);

		handleFileContents(
			[...map.map].map(([path, o]) => {
				return {
					path,
					content: o.content,
					fileExists: o.exists,
				};
			})
		);
	}
}

class SingleFileWatcher {
	private readonly watcher = watch(this.path, { encoding: "utf-8" }, () =>
		this.scheduleRefresh(this)
	);
	private isDisposed = false;
	public content: string | undefined;
	public exists: boolean = true;

	constructor(
		public readonly path: string,
		private readonly scheduleRefresh: (self: SingleFileWatcher) => void
	) {
		this.scheduleRefresh(this);
	}

	public dispose() {
		this.isDisposed = true;
		this.content = undefined;
		this.scheduleRefresh(this);
		this.watcher.close();
	}

	public refresh() {
		if (this.isDisposed) {
			return true;
		}

		if (!existsSync(this.path)) {
			this.exists = false;
			this.content = undefined;
			return;
		}

		const newContent = readFileSync(this.path, "utf-8");
		if (newContent !== this.content) {
			this.content = newContent;
			return true;
		}
		return false;
	}
}
