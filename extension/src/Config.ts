import { workspace, window, ColorThemeKind } from "vscode";
import { Disposable } from "@hediet/std/disposable";
import { observable } from "mobx";
import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import { VsCodeSetting, serializerWithDefault } from "./utils/VsCodeSettings";

export class Config {
	public dispose = Disposable.fn();

	private readonly _useChromeKioskMode = new VsCodeSetting(
		"debugVisualizer.useChromeKioskMode",
		{ serializer: serializerWithDefault<boolean>(true) }
	);

	public get useChromeKioskMode(): boolean {
		return this._useChromeKioskMode.get();
	}

	private readonly _debugAdapterConfigs = new VsCodeSetting(
		"debugVisualizer.debugAdapterConfigurations",
		{ serializer: serializerWithDefault<DebugAdapterConfigs>({}) }
	);

	private readonly _customScriptPaths = new VsCodeSetting(
		"debugVisualizer.js.customScriptPaths",
		{ serializer: serializerWithDefault<string[]>([]) }
	);

	public get customScriptPaths(): string[] {
		return this._customScriptPaths.get().map(p => {
			const tpl = new SimpleTemplate(p);
			return tpl.render({
				workspaceFolder: () => {
					const workspaceFolder = (workspace.workspaceFolders ||
						[])[0];
					if (!workspaceFolder) {
						throw new Error(
							`Cannot get workspace folder - '${p}' cannot be evaluated!`
						);
					}
					return workspaceFolder.uri.fsPath;
				},
			});
		});
	}

	@observable
	private _vsCodeTheme = window.activeColorTheme;

	public get theme(): "light" | "dark" {
		if (this._vsCodeTheme.kind === ColorThemeKind.Light) {
			return "light";
		} else if (this._vsCodeTheme.kind === ColorThemeKind.Dark) {
			return "dark";
		}
		return "light";
	}

	constructor() {
		this.dispose.track(
			window.onDidChangeActiveColorTheme(() => {
				this._vsCodeTheme = window.activeColorTheme;
			})
		);
	}

	public getDebugAdapterConfig(
		debugAdapterType: string
	): DebugAdapterConfig | undefined {
		const c = this._debugAdapterConfigs.get()[debugAdapterType];
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

export class SimpleTemplate {
	constructor(private readonly str: string) {}

	render(data: Record<string, () => string>): string {
		return this.str.replace(/\$\{([a-zA-Z0-9]+)\}/g, (substr, grp1) => {
			return data[grp1]();
		});
	}
}
