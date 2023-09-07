import {
	DataExtractionResult,
	DataExtractorId,
} from "@hediet/debug-visualizer-data-extraction";
import { Disposable } from "@hediet/std/disposable";
import { EventEmitter, EventSource } from "@hediet/std/events";
import { reaction } from "mobx";
import { DebugSessionProxy } from "../proxies/DebugSessionProxy";
import { DebuggerViewProxy } from "../proxies/DebuggerViewProxy";
import { CompletionItem, FormattedMessage } from "../webviewContract";

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
	readonly expression: string;
	readonly preferredExtractorId: DataExtractorId | undefined;

	// Can be used to attach data to the session.
	readonly sessionStore: { data: unknown };
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
				(activeStackFrameId) => {
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
