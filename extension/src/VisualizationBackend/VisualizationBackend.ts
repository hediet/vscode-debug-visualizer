import {
	DataExtractionResult,
	DataExtractorId,
} from "@hediet/debug-visualizer-data-extraction";
import { Disposable } from "@hediet/std/disposable";
import { DebugSessionProxy } from "../proxies/DebugSessionProxy";
import { CompletionItem, FormattedMessage } from "../webviewContract";
import { reaction } from "mobx";
import { DebuggerViewProxy } from "../proxies/DebuggerViewProxy";
import { EventEmitter, EventSource } from "@hediet/std/events";

export interface DebugSessionVisualizationSupport {
	createBackend(session: DebugSessionProxy): VisualizationBackend | undefined;
}

export interface VisualizationBackend extends Disposable {
	readonly onChange: EventSource;

	getVisualizationData(
		args: GetVisualizationDataArgs
	): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
	>;

	/**
	 * The language that expressions must be written in.
	 */
	readonly expressionLanguageId: string | undefined;

	getCompletions(text: string, column: number): Promise<CompletionItem[]>;
}

export interface GetVisualizationDataArgs {
	expression: string;
	preferredExtractorId: DataExtractorId | undefined;
}

export abstract class VisualizationBackendBase implements VisualizationBackend {
	public readonly dispose = Disposable.fn();

	protected readonly onChangeEmitter = new EventEmitter();
	public readonly onChange = this.onChangeEmitter;

	constructor(
		protected readonly debugSession: DebugSessionProxy,
		protected readonly debuggerView: DebuggerViewProxy
	) {
		this.dispose.track({
			dispose: reaction(
				() => debuggerView.getActiveStackFrameId(debugSession),
				activeStackFrameId => {
					if (activeStackFrameId !== undefined) {
						this.onChangeEmitter.emit();
					}
				}
			),
		});
	}

	public abstract readonly expressionLanguageId: string | undefined;

	public abstract getVisualizationData(
		args: GetVisualizationDataArgs
	): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
	>;

	public async getCompletions(
		text: string,
		column: number
	): Promise<CompletionItem[]> {
		return await this.debugSession.getCompletions({
			text,
			frameId: this.debuggerView.getActiveStackFrameId(this.debugSession),
			column,
		});
	}
}
