import * as monaco from "monaco-editor";
import { Model } from "./Model";

export class MonacoBridge {
	constructor(private readonly model: Model) {
		monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: false,
			noSyntaxValidation: false,
		});

		monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.ES5,
			allowNonTsExtensions: true,
			moduleResolution:
				monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: monaco.languages.typescript.ModuleKind.CommonJS,
			strict: true,
		});

		const text = require("!!raw-loader!./lib.es5.d.ts.txt")
			.default as string;

		monaco.languages.typescript.javascriptDefaults.addExtraLib(text);

		const commonTypes = require("!!raw-loader!@hediet/debug-visualizer-data-extraction/src/CommonDataTypes.ts")
			.default as string;

		monaco.languages.typescript.javascriptDefaults.addExtraLib(
			commonTypes,
			`file:///node_modules/CommonDataTypes/index.ts`
		);
		monaco.languages.typescript.javascriptDefaults.addExtraLib(
			`declare function $asData(data: import("CommonDataTypes").CommonDataType): import("CommonDataTypes").CommonDataType;`,
			`file:///types.d.ts`
		);

		monaco.languages.registerCompletionItemProvider("javascript", {
			triggerCharacters: ["."],
			provideCompletionItems: async (
				textModel,
				position
			): Promise<monaco.languages.CompletionList> => {
				const expression = textModel.getValue();

				if (!this.model.server) {
					return { suggestions: [] };
				}
				const completions = (await this.model.server.getCompletions({
					text: expression,
					column: position.column,
				})).completions;

				const map = {
					method: monaco.languages.CompletionItemKind.Method,
					function: monaco.languages.CompletionItemKind.Function,
					constructor:
						monaco.languages.CompletionItemKind.Constructor,
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
					customcolor:
						monaco.languages.CompletionItemKind.Customcolor,
				};

				const p = textModel.getWordAtPosition(position);

				return {
					suggestions: completions.map<
						monaco.languages.CompletionItem
					>(c => {
						const startColumn =
							c.start || (p && p.startColumn) || position.column;

						return {
							insertText: c.text || c.label,
							label: c.label,
							kind: map[c.type || "text"],
							range: {
								startColumn,
								endColumn: startColumn + (c.length || 0),
								startLineNumber: 0,
								endLineNumber: 0,
							},
							sortText:
								c.type === "property" ? "zzzzzzz" : c.label,
						};
					}),
				};
			},
		});
	}
}
