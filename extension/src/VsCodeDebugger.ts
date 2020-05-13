import { Disposable } from "@hediet/std/disposable";
import { debug, DebugSession } from "vscode";
import { EventEmitter } from "@hediet/std/events";
import { CompletionItem } from "./contract";
import { observable, runInAction, action } from "mobx";

export class VsCodeDebugger {
	public readonly dispose = Disposable.fn();
	private readonly sessions = new Map<DebugSession, VsCodeDebugSession>();

	private readonly _onDidStartDebugSession = new EventEmitter<{
		session: VsCodeDebugSession;
	}>();
	public readonly onDidStartDebugSession = this._onDidStartDebugSession.asEvent();

	public getDebugSession(session: DebugSession): VsCodeDebugSession {
		let result = this.sessions.get(session);
		if (!result) {
			result = new VsCodeDebugSession(session);
			this.sessions.set(session, result);
		}
		return result;
	}

	constructor() {
		this.dispose.track([
			debug.onDidStartDebugSession(session => {
				const e = this.sessions.get(session)!;
				this._onDidStartDebugSession.emit({ session: e });
			}),
			debug.onDidTerminateDebugSession(session => {
				this.sessions.delete(session);
			}),
			debug.registerDebugAdapterTrackerFactory("*", {
				createDebugAdapterTracker: session => {
					const extendedSession = this.getDebugSession(session);
					return {
						onWillReceiveMessage: msg => {
							console.log(msg.type, msg.event, msg);
						},
						onDidSendMessage: async msg => {
							type Message =
								| StoppedEvent
								| ThreadsResponse
								| ContinueLikeResponse;

							interface ContinueLikeResponse {
								type: "response";
								command:
									| "continue"
									| "stepIn"
									| "stepOut"
									| "next";
							}

							interface StoppedEvent {
								type: "event";
								event: "stopped";
								body: {
									threadId: number;
								};
							}

							interface ThreadsResponse {
								type: "response";
								command: "threads";
								success: boolean;
								body: {
									threads: ThreadInfo[];
								};
							}

							interface ThreadInfo {
								id: number;
								name: string;
							}

							const m = msg as Message;
							if (m.type === "event") {
								if (m.event === "stopped") {
									const threadId = m.body.threadId;
									const r = await extendedSession[
										"getStackTrace"
									]({
										threadId,
										startFrame: 0,
										levels: 1,
									});
									extendedSession["activeStackFrame"] =
										r.stackFrames.length > 0
											? r.stackFrames[0].id
											: undefined;
								}
							} else if (m.type === "response") {
								if (
									m.command === "continue" ||
									m.command === "next" ||
									m.command === "stepIn" ||
									m.command === "stepOut"
								) {
									extendedSession[
										"activeStackFrame"
									] = undefined;
								}
							}
						},
					};
				},
			}),
		]);
	}
}

interface StackFrame {
	id: number;
	name: string;
}

export class VsCodeDebugSession {
	@observable protected activeStackFrame: number | undefined;

	constructor(public readonly session: DebugSession) {}

	protected async getStackTrace(args: {
		threadId: number;
		startFrame?: number;
		levels?: number;
	}): Promise<{ totalFrames?: number; stackFrames: StackFrame[] }> {
		try {
			const reply = (await this.session.customRequest("stackTrace", {
				threadId: args.threadId,
				levels: args.levels,
				startFrame: args.startFrame || 0,
			})) as { totalFrames?: number; stackFrames: StackFrame[] };
			return reply;
		} catch (e) {
			console.error(e);
			throw e;
		}
	}

	public async getCompletions(args: {
		text: string;
		column: number;
		frameId: number | undefined;
	}): Promise<CompletionItem[]> {
		try {
			const reply = await this.session.customRequest("completions", {
				text: args.text,
				frameId: args.frameId,
				column: args.column,
			});
			if (!reply) {
				return [];
			}
			return reply.targets;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	/**
	 * Evaluates the given expression.
	 * If context is "watch", long results are usually shortened.
	 */
	public async evaluate(args: {
		expression: string;
		frameId: number | undefined;
		context: "watch" | "repl";
	}): Promise<{ result: string }> {
		const reply = await this.session.customRequest("evaluate", {
			expression: args.expression,
			frameId: args.frameId,

			context: args.context,
		});
		return { result: reply.result };
	}
}

export class VsCodeDebuggerView {
	public readonly dispose = Disposable.fn();

	@observable private _activeDebugSession: VsCodeDebugSession | undefined;

	public get activeDebugSession(): VsCodeDebugSession | undefined {
		return this._activeDebugSession;
	}

	public get activeFrameId(): number | undefined {
		if (!this._activeDebugSession) {
			return undefined;
		} else {
			return this._activeDebugSession["activeStackFrame"];
		}
	}

	constructor(private vsCodeDebugger: VsCodeDebugger) {
		this.dispose.track(
			debug.onDidChangeActiveDebugSession(activeSession => {
				this.updateActiveDebugSession(activeSession);
			})
		);
		this.updateActiveDebugSession(debug.activeDebugSession);
	}

	@action
	private updateActiveDebugSession(activeSession: DebugSession | undefined) {
		if (!activeSession) {
			this._activeDebugSession = undefined;
		} else {
			const s = this.vsCodeDebugger.getDebugSession(activeSession);
			this._activeDebugSession = s;
		}
	}
}
