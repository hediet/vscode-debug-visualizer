import { Disposable } from "@hediet/std/disposable";
import { debug, DebugSession } from "vscode";
import { EventEmitter } from "@hediet/std/events";
import { runInAction } from "mobx";
import { DebugSessionProxy } from "./DebugSessionProxy";

/**
 * Decorates DebugSession instances and emits an event for new debug sessions.
 */
export class DebuggerProxy {
	public readonly dispose = Disposable.fn();
	private readonly sessions = new Map<DebugSession, DebugSessionProxy>();

	private readonly _onDidStartDebugSession = new EventEmitter<{
		session: DebugSessionProxy;
	}>();
	public readonly onDidStartDebugSession = this._onDidStartDebugSession.asEvent();

	public getDebugSessionProxy(session: DebugSession): DebugSessionProxy {
		let result = this.sessions.get(session);
		if (!result) {
			result = new DebugSessionProxy(session);
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
					const extendedSession = this.getDebugSessionProxy(session);
					return {
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
									extendedSession["_activeStackFrameId"] =
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
										"_activeStackFrameId"
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
