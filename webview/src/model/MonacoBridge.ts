import * as monaco from "monaco-editor";
import { Model } from "./Model";
import { Disposable } from "@hediet/std/disposable";
import { autorun } from "mobx";

declare const require: {
	(path: string): { default: string };
	context: (
		path: string,
		includeSubDirs: boolean,
		regex: RegExp
	) => { (fileName: string): { default: string }; keys(): string[] };
};

export class MonacoBridge {
	public readonly dispose = Disposable.fn();

	constructor(private readonly model: Model) {
		monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: true,
			noSyntaxValidation: true,
		});
		monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.ES5,
			allowNonTsExtensions: true,
			moduleResolution:
				monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: monaco.languages.typescript.ModuleKind.CommonJS,
			strict: true,
		});

		const es5Lib = require("!!raw-loader!./lib.es5.d.ts.txt").default;
		const commonTypes = require.context(
			"!!raw-loader!@hediet/debug-visualizer-data-extraction/dist/src/",
			true,
			/.*.d.ts$/
		);

		for (const file of commonTypes.keys()) {
			console.log(file);
			this.dispose.track(
				monaco.languages.typescript.javascriptDefaults.addExtraLib(
					commonTypes(file).default,
					`file:///node_modules/debug-visualizer-data-extraction/${file}`
				)
			);
		}

		this.dispose.track([
			monaco.languages.typescript.javascriptDefaults.addExtraLib(es5Lib),
			monaco.languages.typescript.javascriptDefaults.addExtraLib(
				`declare const hedietDbgVis: typeof import("debug-visualizer-data-extraction/js/helpers")`,
				`file:///types.d.ts`
			),
		]);

		const debugSessionCompletionProvider = new DebugSessionCompletionProvider(
			this.model
		);

		this.dispose.track([
			monaco.languages.registerCompletionItemProvider(
				"javascript",
				debugSessionCompletionProvider
			),
			monaco.languages.registerCompletionItemProvider(
				"text",
				debugSessionCompletionProvider
			),
		]);

		this.dispose.track({
			dispose: autorun(() => {
				monaco.editor.setTheme(
					model.theme === "light" ? "vs-light" : "vs-dark"
				);
			}),
		});
	}
}

class DebugSessionCompletionProvider
	implements monaco.languages.CompletionItemProvider {
	public readonly triggerCharacters = ["."];

	private readonly map = {
		method: monaco.languages.CompletionItemKind.Method,
		function: monaco.languages.CompletionItemKind.Function,
		constructor: monaco.languages.CompletionItemKind.Constructor,
		field: monaco.languages.CompletionItemKind.Field,
		variable: monaco.languages.CompletionItemKind.Variable,
		class: monaco.languages.CompletionItemKind.Class,
		interface: monaco.languages.CompletionItemKind.Interface,
		module: monaco.languages.CompletionItemKind.Module,
		property: monaco.languages.CompletionItemKind.Property,
		unit: monaco.languages.CompletionItemKind.Unit,
		value: monaco.languages.CompletionItemKind.Value,
		enum: monaco.languages.CompletionItemKind.Enum,
		keyword: monaco.languages.CompletionItemKind.Keyword,
		snippet: monaco.languages.CompletionItemKind.Snippet,
		text: monaco.languages.CompletionItemKind.Text,
		color: monaco.languages.CompletionItemKind.Color,
		file: monaco.languages.CompletionItemKind.File,
		reference: monaco.languages.CompletionItemKind.Reference,
		customcolor: monaco.languages.CompletionItemKind.Customcolor,
	};

	constructor(private readonly model: Model) {}

	public async provideCompletionItems(
		model: monaco.editor.ITextModel,
		position: monaco.Position,
		context: monaco.languages.CompletionContext
	): Promise<monaco.languages.CompletionList> {
		const expression = model.getValue();

		if (!this.model.server) {
			return { suggestions: [] };
		}
		const completions = (
			await this.model.server.getCompletions({
				text: expression,
				column: position.column,
			})
		).completions;

		const p = model.getWordAtPosition(position);

		return {
			suggestions: completions.map<monaco.languages.CompletionItem>(c => {
				const startColumn =
					c.start || (p && p.startColumn) || position.column;

				return {
					insertText: c.text || c.label,
					label: c.label,
					kind: this.map[c.type || "text"],
					range: {
						startColumn,
						endColumn: startColumn + (c.length || 0),
						startLineNumber: 0,
						endLineNumber: 0,
					},
					sortText: c.type === "property" ? "zzzzzzz" : c.label,
				};
			}),
		};
	}
}
