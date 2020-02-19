import * as ts from "typescript";

export class MockLanguageServiceHost implements ts.LanguageServiceHost {
	constructor(
		private readonly files: Map<string, string>,
		private readonly compilationSettings: ts.CompilerOptions
	) {}

	getScriptFileNames(): string[] {
		return [...this.files.keys()];
	}

	getScriptVersion(fileName: string): string {
		return ""; // our files don't change
	}

	getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
		const content = this.files.get(fileName);
		if (!content) {
			return undefined;
		}
		return {
			dispose() {},
			getChangeRange: () => undefined,
			getLength: () => content.length,
			getText: (start, end) => content.substr(start, end - start),
		};
	}

	getCompilationSettings(): ts.CompilerOptions {
		return this.compilationSettings;
	}
	getCurrentDirectory(): string {
		return "/";
	}
	getDefaultLibFileName(options: ts.CompilerOptions): string {
		return ts.getDefaultLibFileName(options);
	}
}
