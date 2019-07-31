import { DataSource, EvaluationWatcher } from "./DataSource";
import { observable } from "mobx";
import * as vscode from "vscode";
import { Disposable } from "@hediet/std/disposable";
import {
	selfContainedGetInitializedDataExtractorApi,
	DataResult,
	DataExtractorId,
	ApiHasNotBeenInitializedCode,
	selfContainedInitDataExtractorApi,
} from "@hediet/debug-visualizer-data-extraction";
import { DataExtractionState } from "@hediet/debug-visualizer-vscode-shared";

export function createJsDebuggerSource(): JsDataSource {
	return new JsDebuggerSourceImplementation();
}

export interface JsCode extends String {
	__brand: "JsCode";
}

export interface JsDataSource extends DataSource {
	registerDataExtractor(classExpression: JsCode): void;
}

class JsDebuggerSourceImplementation implements JsDataSource {
	private lastFrameId: number | null = null;
	private readonly watchers = new Set<ObservableEvaluationWatcher>();

	public readonly dispose = Disposable.fn();

	constructor() {
		this.dispose.track(
			vscode.debug.onDidReceiveDebugSessionCustomEvent(e => {
				if (e.event === "paused") {
					const frameId = e.body.currentFrameId;
					this.lastFrameId = frameId;

					for (const w of this.watchers) {
						w.refresh();
					}
				}
			})
		);
	}

	registerDataExtractor(classExpression: JsCode): void {}

	public createEvaluationWatcher(expression: string): EvaluationWatcher {
		const w = new ObservableEvaluationWatcher(expression, this);
		this.watchers.add(w);
		this.refresh(w);
		return w;
	}

	public removeWatcher(w: ObservableEvaluationWatcher) {
		this.watchers.delete(w);
	}

	public async refresh(w: ObservableEvaluationWatcher): Promise<void> {
		const session = vscode.debug.activeDebugSession;
		if (!session) {
			w._state = { kind: "noDebugSession" };
			return;
		}

		try {
			w._state = { kind: "loading" };
			const expression = `(${selfContainedGetInitializedDataExtractorApi.toString()})().getData(${
				w.expression
			})`;

			const reply = await session.customRequest("evaluate", {
				expression,
				frameId: this.lastFrameId,
				context: "watch",
			});
			const resultStr = reply.result as string;
			const jsonData = resultStr.substr(1, resultStr.length - 2);
			const result = JSON.parse(jsonData) as DataResult;
			if (result.kind === "NoExtractors") {
				throw new Error("No extractors");
			}

			w._state = {
				kind: "data",
				result: result.extractionResult,
			};
		} catch (error) {
			const msg = error.message as string | undefined;
			if (msg && msg.includes(ApiHasNotBeenInitializedCode)) {
				if (await this.initializeApi(session)) {
					await this.refresh(w);
					return;
				}
			}

			w._state = {
				kind: "error",
				message: error.message,
			};
		}
	}

	private async initializeApi(
		session: vscode.DebugSession
	): Promise<boolean> {
		try {
			const expression = `(${selfContainedInitDataExtractorApi.toString()})()`;

			const reply = await session.customRequest("evaluate", {
				expression,
				frameId: this.lastFrameId,
				context: "watch",
			});
			if (reply.result === "true") {
				// register extractors
			}
			return true;
		} catch (error) {
			return false;
		}
	}
}

class ObservableEvaluationWatcher implements EvaluationWatcher {
	constructor(
		public readonly expression: string,
		private readonly source: JsDebuggerSourceImplementation
	) {}

	@observable
	_preferredDataExtractor: DataExtractorId | undefined = undefined;

	get preferredDataExtractor(): DataExtractorId | undefined {
		return this._preferredDataExtractor;
	}

	public setPreferredDataExtractor(id: DataExtractorId): void {
		this._preferredDataExtractor = id;
		this.refresh();
	}

	public refresh(): void {
		this.source.refresh(this);
	}

	@observable
	public _state: DataExtractionState = { kind: "loading" };
	public get state(): DataExtractionState {
		return this._state;
	}

	public dispose(): void {
		this.source.removeWatcher(this);
	}
}
