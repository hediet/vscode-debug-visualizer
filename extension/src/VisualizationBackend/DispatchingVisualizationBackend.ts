import { DataExtractionResult } from "@hediet/debug-visualizer-data-extraction";
import { CompletionItem, FormattedMessage } from "../webviewContract";
import {
	DebugSessionVisualizationSupport,
	GetVisualizationDataArgs,
	VisualizationBackend,
} from "./VisualizationBackend";
import { EventEmitter, EventSource } from "@hediet/std/events";
import { debug } from "vscode";
import { DebugSessionProxy } from "../proxies/DebugSessionProxy";
import { Disposable } from "@hediet/std/disposable";
import { DebuggerViewProxy } from "../proxies/DebuggerViewProxy";
import { autorun, reaction } from "mobx";

export class DispatchingVisualizationBackend implements VisualizationBackend {
	public readonly dispose = Disposable.fn();
	private readonly visualizationBackends = new Map<
		DebugSessionProxy,
		VisualizationBackend
	>();

	protected readonly onChangeEmitter = new EventEmitter();
	public readonly onChange = this.onChangeEmitter;

	constructor(
		private readonly visualizationSupport: DebugSessionVisualizationSupport,
		private readonly debuggerView: DebuggerViewProxy
	) {
		this.dispose.track(
			debug.onDidTerminateDebugSession(session => {
				const existing = [...this.visualizationBackends].find(
					v => v[0].session === session
				);
				if (existing) {
					this.visualizationBackends.delete(existing[0]);
					existing[1].dispose();
				}
			})
		);

		this.dispose.track({
			dispose: () => {
				for (const backend of this.visualizationBackends.values()) {
					backend.dispose();
				}
				this.visualizationBackends.clear();
			},
		});

		this.dispose.track({
			dispose: reaction(
				() => this.debuggerView.activeDebugSession,
				debugSession => {
					if (debugSession !== undefined) {
						this.onChangeEmitter.emit();
					}
				}
			),
		});
	}

	private getVisualizationBackend(
		debugSession: DebugSessionProxy
	): VisualizationBackend | undefined {
		const existing = this.visualizationBackends.get(debugSession);
		if (existing) {
			return existing;
		}

		const newBackend = this.visualizationSupport.createBackend(
			debugSession
		);

		if (!newBackend) {
			return undefined;
		}

		newBackend.onChange.sub(() => {
			this.onChangeEmitter.emit();
		});

		this.visualizationBackends.set(debugSession, newBackend);

		return newBackend;
	}

	private get activeVisualizationBackend(): VisualizationBackend | undefined {
		const activeDebugSession = this.debuggerView.activeDebugSession;
		if (!activeDebugSession) {
			return undefined;
		}
		const backend = this.getVisualizationBackend(activeDebugSession);
		return backend;
	}

	public async getVisualizationData(
		args: GetVisualizationDataArgs
	): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
	> {
		const activeDebugSession = this.debuggerView.activeDebugSession;
		if (!activeDebugSession) {
			return {
				kind: "error",
				message: "No active debug session.",
			};
		}
		const backend = this.getVisualizationBackend(activeDebugSession);
		if (!backend) {
			return {
				kind: "error",
				message: `The debug adapter "${activeDebugSession.session.type}" is not supported.`,
			};
		}
		return await backend.getVisualizationData(args);
	}

	public get expressionLanguageId(): string | undefined {
		return this.activeVisualizationBackend?.expressionLanguageId;
	}

	public async getCompletions(
		text: string,
		column: number
	): Promise<CompletionItem[]> {
		return (
			(await this.activeVisualizationBackend?.getCompletions(
				text,
				column
			)) || []
		);
	}
}
