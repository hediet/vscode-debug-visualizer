import {
	DataSource,
	EvaluationWatcher,
	EvaluationWatcherOptions,
} from "./DataSource";
import { observable, autorun, action } from "mobx";
import { Disposable } from "@hediet/std/disposable";
import {
	getExpressionForDataExtractorApi,
	DataResult,
	DataExtractorId,
	ApiHasNotBeenInitializedCode,
	getExpressionToInitializeDataExtractorApi,
} from "@hediet/debug-visualizer-data-extraction";
import {
	DataExtractionState,
	CompletionItem,
} from "@hediet/debug-visualizer-vscode-shared";
import { hotClass } from "@hediet/node-reload";
import { VsCodeDebuggerView, VsCodeDebugSession } from "../VsCodeDebugger";

export function createJsDebuggerSource(args: {
	vsCodeDebuggerView: VsCodeDebuggerView;
}): JsDataSource {
	return new JsDebuggerSourceImplementation(args.vsCodeDebuggerView);
}

export interface JsCode extends String {
	__brand: "JsCode";
}

export interface JsDataSource extends DataSource {
	registerDataExtractor(classExpression: JsCode): void;
}

@hotClass(module)
export class JsDebuggerSourceImplementation implements JsDataSource {
	public readonly dispose = Disposable.fn();
	private readonly watchers = new Set<ObservableEvaluationWatcher>();

	constructor(private readonly vsCodeDebuggerView: VsCodeDebuggerView) {
		this.dispose.track({
			dispose: autorun(() => {
				if (
					vsCodeDebuggerView.activeDebugSession &&
					vsCodeDebuggerView.activeFrameId !== undefined
				) {
					for (const w of this.watchers) {
						w.refresh();
					}
				}
			}),
		});
	}

	registerDataExtractor(classExpression: JsCode): void {
		// TODO implement
	}

	public async getCompletions(
		text: string,
		column: number
	): Promise<CompletionItem[]> {
		const session = this.vsCodeDebuggerView.activeDebugSession;
		if (!session) {
			return [];
		}
		return await session.getCompletions({
			text,
			frameId: this.vsCodeDebuggerView.activeFrameId,
			column,
		});
	}

	public createEvaluationWatcher(
		expression: string,
		options: EvaluationWatcherOptions
	): EvaluationWatcher {
		const w = new ObservableEvaluationWatcher(expression, this, options);
		this.watchers.add(w);
		this.refresh(w);
		return w;
	}

	public removeWatcher(w: ObservableEvaluationWatcher) {
		this.watchers.delete(w);
	}

	public async refresh(w: ObservableEvaluationWatcher): Promise<void> {
		const session = this.vsCodeDebuggerView.activeDebugSession;
		if (!session) {
			w._state = { kind: "noDebugSession" };
			return;
		}

		const frameId = this.vsCodeDebuggerView.activeFrameId;

		try {
			w._state = { kind: "loading" };

			const preferredExtractor = w.preferredDataExtractor
				? `"${w.preferredDataExtractor}"`
				: "undefined";

			const body = `${getExpressionForDataExtractorApi()}.getData(
				e => (${w.expression}),
				expr => eval(expr),
				${preferredExtractor}
			)`;

			const expression = `
				(() => {
					try {
						return ${body};
					} catch (e) {
						return JSON.stringify({
							kind: "Error",
							message: e.message,
							stack: e.stack
						});
					}
				})()
			`;

			const reply = await session.evaluate({
				expression,
				frameId,
			});
			const resultStr = reply.result;
			const jsonData = resultStr.substr(1, resultStr.length - 2);
			const result = JSON.parse(jsonData) as DataResult;
			if (result.kind === "NoExtractors") {
				throw new Error("No extractors");
			} else if (result.kind === "Error") {
				throw new Error(result.message);
			}

			w._state = {
				kind: "data",
				result: result.extractionResult,
			};
		} catch (error) {
			const msg = error.message as string | undefined;
			if (msg && msg.includes(ApiHasNotBeenInitializedCode)) {
				if (await this.initializeApi(session, frameId)) {
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
		session: VsCodeDebugSession,
		frameId: number | undefined
	): Promise<boolean> {
		try {
			// prefer existing is true, so that manually registered (possibly newer) extractors are not overwritten.
			const expression = `${getExpressionToInitializeDataExtractorApi()}.registerDefaultExtractors(true);`;

			await session.evaluate({
				expression,
				frameId,
			});

			return true;
		} catch (error) {
			return false;
		}
	}
}

class ObservableEvaluationWatcher implements EvaluationWatcher {
	constructor(
		public readonly expression: string,
		private readonly source: JsDebuggerSourceImplementation,
		options: EvaluationWatcherOptions
	) {
		this._preferredDataExtractor = options.preferredDataExtractor;
	}

	@observable
	private _preferredDataExtractor: DataExtractorId | undefined = undefined;

	public get preferredDataExtractor(): DataExtractorId | undefined {
		return this._preferredDataExtractor;
	}

	@action
	public setPreferredDataExtractor(id: DataExtractorId | undefined): void {
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
