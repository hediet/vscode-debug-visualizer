import { Disposable } from "@hediet/std/disposable";
import { VsCodeDebugger, VsCodeDebuggerView } from "../VsCodeDebugger";
import { createJsDebuggerSource } from "./JsDebuggerSource";

export class Sources {
	public readonly dispose = Disposable.fn();
	private readonly debugger = this.dispose.track(new VsCodeDebugger());
	private readonly debuggerView = this.dispose.track(
		new VsCodeDebuggerView(this.debugger)
	);

	public readonly jsSource = createJsDebuggerSource({
		vsCodeDebuggerView: this.debuggerView,
	});
}
