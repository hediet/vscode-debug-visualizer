import { Barrier } from "@hediet/std/synchronization";

export interface VSCodeApi<TState> {
	getState(): Promise<TState | undefined>;
	setState(state: TState): Promise<void>;
}

type IncomingCommand = {
	command: "getStateResult";
	state: unknown;
};

type OutgoingCommand =
	| {
			command: "setState";
			state: unknown;
	  }
	| { command: "getState" };

interface VsCodeApi {
	getState<TState>(): TState | undefined;
	setState(state: unknown): void;
}

export function getApi<TState>(): VSCodeApi<TState> {
	return window.VsCodeApi
		? new DirectVSCodeApi<TState>(window.VsCodeApi)
		: new IFrameVSCodeApi<TState>();
}

declare const window: Window & {
	VsCodeApi?: VsCodeApi;
};

export class IFrameVSCodeApi<TState> implements VSCodeApi<TState> {
	private currentGetStatePromise: Barrier<TState> | undefined = undefined;

	constructor() {
		window.addEventListener("message", event => {
			const data = event.data as IncomingCommand;
			if (data.command === "getStateResult") {
				this.currentGetStatePromise!.unlock(data.state as any);
			}
		});
	}

	private sendCommand(command: OutgoingCommand) {
		window.parent.postMessage(command, "*");
	}

	getState(): Promise<TState | undefined> {
		this.sendCommand({ command: "getState" });
		if (this.currentGetStatePromise) {
			throw new Error("Get state already in progress.");
		}
		this.currentGetStatePromise = new Barrier();
		return this.currentGetStatePromise.onUnlocked;
	}

	async setState(state: TState): Promise<void> {
		this.sendCommand({ command: "setState", state });
	}
}

export class DirectVSCodeApi<TState> implements VSCodeApi<TState> {
	constructor(private readonly vsCodeApi: VsCodeApi) {}

	async getState(): Promise<TState | undefined> {
		return this.vsCodeApi.getState<TState | undefined>();
	}

	async setState(state: TState): Promise<void> {
		this.vsCodeApi.setState(state);
	}
}
