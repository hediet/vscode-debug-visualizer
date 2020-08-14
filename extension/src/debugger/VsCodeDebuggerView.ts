import { Disposable } from "@hediet/std/disposable";
import { debug, DebugSession } from "vscode";
import { observable, action } from "mobx";
import { VsCodeDebugger } from "./VsCodeDebugger";
import { EnhancedDebugSession } from "./EnhancedDebugSession";

/**
 * Tracks the currently active debug session and its currently active stack frame.
 * This is currently all faked. A proper API would be nice.
 */
export class VsCodeDebuggerView {
	public readonly dispose = Disposable.fn();

	@observable private _activeDebugSession: EnhancedDebugSession | undefined;

	public get activeDebugSession(): EnhancedDebugSession | undefined {
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
			const s = this.vsCodeDebugger.getEnhancedDebugSession(
				activeSession
			);
			this._activeDebugSession = s;
		}
	}
}
