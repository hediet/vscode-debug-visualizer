import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import { hotClass } from "@hediet/node-reload";
import { Disposable } from "@hediet/std/disposable";
import { EventEmitter } from "@hediet/std/events";
import { wait } from "@hediet/std/timer";
import { action, observable } from "mobx";
import { CancellationToken, CancellationTokenSource } from "vscode";
import { VisualizationBackend } from "../VisualizationBackend/VisualizationBackend";
import { CompletionItem, DataExtractionState } from "../webviewContract";
import {
	VisualizationWatch,
	VisualizationWatchModel,
	VisualizationWatchOptions,
} from "./VisualizationWatchModel";

@hotClass(module)
export class VisualizationWatchModelImpl implements VisualizationWatchModel {
	public readonly dispose = Disposable.fn();
	private readonly watchers = new Set<ObservableVisualizationWatch>();

	constructor(private readonly visualizationBackend: VisualizationBackend) {
		this.dispose.track(
			visualizationBackend.onChange.sub(() => {
				if (visualizationBackend.expressionLanguageId !== undefined) {
					this.lastLanguageId =
						visualizationBackend.expressionLanguageId;
				}
			})
		);
		this.lastLanguageId = visualizationBackend.expressionLanguageId;
	}

	public createWatch(
		expression: string,
		options: VisualizationWatchOptions
	): VisualizationWatch {
		const w = new ObservableVisualizationWatch(
			expression,
			options,
			this.visualizationBackend
		);
		w.onDispose.sub(() => {
			this.watchers.delete(w);
		});
		this.watchers.add(w);
		return w;
	}

	@observable
	private lastLanguageId: string | undefined = undefined;

	get languageId(): string | undefined {
		return this.lastLanguageId;
	}

	public getCompletions(
		text: string,
		column: number
	): Promise<CompletionItem[]> {
		return this.visualizationBackend.getCompletions(text, column);
	}
}

class ObservableVisualizationWatch implements VisualizationWatch {
	public readonly dispose = Disposable.fn();
	private readonly onDisposeEmitter = new EventEmitter();
	public readonly onDispose = this.onDisposeEmitter.asEvent();

	constructor(
		public readonly expression: string,
		options: VisualizationWatchOptions,
		private readonly visualizationBackend: VisualizationBackend
	) {
		this._preferredDataExtractor = options.preferredDataExtractor;

		this.dispose.track(
			visualizationBackend.onChange.sub(() => {
				this.refresh();
			})
		);

		this.dispose.track({
			dispose: () => {
				this.onDisposeEmitter.emit();
			},
		});

		this.refresh();
	}

	private _preferredDataExtractor: DataExtractorId | undefined = undefined;

	public get preferredDataExtractor(): DataExtractorId | undefined {
		return this._preferredDataExtractor;
	}

	@action
	public setPreferredDataExtractor(id: DataExtractorId | undefined): void {
		this._preferredDataExtractor = id;
		this.refresh();
	}

	private runningRefreshOperation: Disposable | undefined;

	public refresh(): void {
		if (this.runningRefreshOperation) {
			this.runningRefreshOperation.dispose();
		}
		const tokenSource = new CancellationTokenSource();
		this.runningRefreshOperation = {
			dispose: () => {
				tokenSource.cancel();
			},
		};
		this._refresh(tokenSource.token);
	}

	private async _refresh(token: CancellationToken): Promise<void> {
		/*const session = this.debuggerView.activeDebugSession;
		if (!session) {
			this._state = { kind: "noDebugSession" };
			return;
		}*/

		//const frameId = this.debuggerView.activeFrameId;

		this._state = { kind: "loading" };

		/*
		const visualizationBackend = this.getVisualizationBackend();
		if (!visualizationBackend) {
			this._state = {
				kind: "error",
				message: `The debug adapter "${session.session.type}" is not supported.`,
			};
			return;
		}*/

		const result = await this.visualizationBackend.getVisualizationData({
			expression: this.expression,
			//frameId,
			preferredExtractorId: this.preferredDataExtractor,
		});

		if (result.kind === "error") {
			// give cancellation requested more time in case of errors
			await wait(330);
		}

		if (token.isCancellationRequested) {
			return;
		}

		this._state = result;
	}

	@observable
	public _state: DataExtractionState = { kind: "loading" };
	public get state(): DataExtractionState {
		return this._state;
	}
}
