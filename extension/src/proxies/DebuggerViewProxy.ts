import { Disposable } from "@hediet/std/disposable";
import { CancellationToken, debug, DebugSession, InlineValue, InlineValueContext, InlineValuesProvider, languages, ProviderResult, Range, TextDocument } from "vscode";
import { observable, action } from "mobx";
import { DebuggerProxy } from "./DebuggerProxy";
import { DebugSessionProxy } from "./DebugSessionProxy";

/**
 * Tracks the currently active debug session and its currently active stack frame.
 * This is currently all faked. A proper API would be nice.
 */
export class DebuggerViewProxy {
	public readonly dispose = Disposable.fn();

	@observable private _activeDebugSession: DebugSessionProxy | undefined;

	public get activeDebugSession(): DebugSessionProxy | undefined {
		return this._activeDebugSession;
	}

	public getActiveStackFrameId(
		session: DebugSessionProxy
	): number | undefined {
		return session["_activeStackFrameId"];
	}

	constructor(private debuggerProxy: DebuggerProxy) {
		this.dispose.track(
			debug.onDidChangeActiveDebugSession(activeSession => {
				this.updateActiveDebugSession(activeSession);
			})
		);
		this.updateActiveDebugSession(debug.activeDebugSession);

		this.dispose.track(languages.registerInlineValuesProvider('*', new FrameIdGetter(this)));
	}

	@action
	private updateActiveDebugSession(activeSession: DebugSession | undefined) {
		this._activeDebugSession = activeSession
			? this.debuggerProxy.getDebugSessionProxy(activeSession)
			: undefined;
	}
}

export class FrameIdGetter implements InlineValuesProvider {
	constructor(
		private readonly debuggerViewProxy: DebuggerViewProxy,
	) {
	}

	provideInlineValues(document: TextDocument, viewPort: Range, context: InlineValueContext, token: CancellationToken): ProviderResult<InlineValue[]> {
		const a = this.debuggerViewProxy.activeDebugSession;
		if (a) {
			a['_activeStackFrameId'] = context.frameId;
		}
		return []
	}
}
