import { workspace } from "vscode";
import { Disposable } from "@hediet/std/disposable";
import { EventEmitter, EventSource } from "@hediet/std/events";

export const useChromeKioskModeKey = "debugVisualizer.useChromeKioskMode";

export class Config {
	private changeEventEmitter = new EventEmitter();
	public readonly onChange: EventSource = this.changeEventEmitter;
	public dispose = Disposable.fn();

	constructor() {
		this.dispose.track(
			workspace.onDidChangeConfiguration(() => {
				this.changeEventEmitter.emit();
			})
		);
	}

	public useChromeKioskMode(): boolean {
		const c = workspace.getConfiguration();
		const b = c.get<boolean>(useChromeKioskModeKey);
		if (b === undefined) {
			return true;
		}
		return b;
	}
}
