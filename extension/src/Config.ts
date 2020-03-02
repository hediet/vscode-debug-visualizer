import { workspace } from "vscode";
import { Disposable } from "@hediet/std/disposable";
import { observable } from "mobx";
import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";

const useChromeKioskModeKey = "debugVisualizer.useChromeKioskMode";
const debugAdapterConfigsKey = "debugVisualizer.debugAdapterConfigurations";

export class Config {
	public dispose = Disposable.fn();

	@observable
	private _useChromeKioskMode!: boolean;

	@observable
	private _debugAdapterConfigs!: DebugAdapterConfigs;

	public get useChromeKioskMode(): boolean {
		return this._useChromeKioskMode;
	}

	public get debugAdapterConfigs(): DebugAdapterConfigs {
		return this._debugAdapterConfigs;
	}

	constructor() {
		this.updateConfig();
		this.dispose.track(
			workspace.onDidChangeConfiguration(() => {
				this.updateConfig();
			})
		);
	}

	private updateConfig(): void {
		const c = workspace.getConfiguration();

		this._useChromeKioskMode = mapUndefined(
			c.get<boolean>(useChromeKioskModeKey),
			true
		);

		this._debugAdapterConfigs = mapUndefined(
			c.get<DebugAdapterConfigs>(debugAdapterConfigsKey),
			{}
		);
	}

	public getDebugAdapterConfig(
		debugAdapterType: string
	): DebugAdapterConfig | undefined {
		const c = this.debugAdapterConfigs[debugAdapterType];
		if (!c) {
			return undefined;
		}

		return {
			context: c.context || "watch",
			getFinalExpression: ({ expression, preferredExtractorId }) =>
				evaluateTemplate(c.expressionTemplate || "${expr}", {
					expr: expression,
					preferredDataExtractorId: preferredExtractorId || "",
				}),
		};
	}
}

function mapUndefined<T>(val: T | undefined, defaultVal: T) {
	if (val === undefined) {
		return defaultVal;
	}
	return val;
}

type DebugAdapterConfigs = {
	[debugAdapter: string]: {
		context?: "watch" | "repl";
		expressionTemplate?: "string";
	};
};

export interface DebugAdapterConfig {
	context: "watch" | "repl";
	getFinalExpression(vars: {
		expression: string;
		preferredExtractorId: DataExtractorId | undefined;
	}): string;
}

function evaluateTemplate(
	template: string,
	data: Record<string, string>
): string {
	let result = template;
	for (const [key, val] of Object.entries(data)) {
		result = result.split(`\${${key}}`).join(val);
	}
	return result;
}
