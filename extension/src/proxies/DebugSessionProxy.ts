import { observable } from "mobx";
import { DebugSession } from "vscode";
import { CompletionItem } from "../webviewContract";

export class DebugSessionProxy {
	@observable private _activeStackFrameId: number | undefined;

	constructor(public readonly session: DebugSession) {}

	public async getStackTrace(args: {
		threadId: number;
		startFrame?: number;
		levels?: number;
	}): Promise<StackTraceInfo> {
		try {
			const reply = (await this.session.customRequest("stackTrace", {
				threadId: args.threadId,
				levels: args.levels,
				startFrame: args.startFrame || 0,
			})) as { totalFrames?: number; stackFrames: StackFrame[] };
			return reply;
		} catch (e) {
			console.error(e);
			throw e;
		}
	}

	public async getCompletions(args: {
		text: string;
		column: number;
		frameId: number | undefined;
	}): Promise<CompletionItem[]> {
		try {
			const reply = await this.session.customRequest("completions", {
				text: args.text,
				frameId: args.frameId,
				column: args.column,
			});
			if (!reply) {
				return [];
			}
			return reply.targets;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	public async getScopes(args: { frameId: number }): Promise<Scope[]> {
		try {
			const reply = await this.session.customRequest("scopes", {
				frameId: args.frameId,
			});
			if (!reply) {
				return [];
			}
			return reply.scopes;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	public async getVariables(args: { variablesReference: number }): Promise<Variable[]> {
		try {
			const reply = await this.session.customRequest("variables", {
				variablesReference: args.variablesReference,
			});
			if (!reply) {
				return [];
			}
			return reply.variables;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	/**
	 * Evaluates the given expression.
	 * If context is "watch", long results are usually shortened.
	 */

	public async evaluate(args: {
		expression: string;
		frameId: number | undefined;
		context: "watch" | "repl" | "copy";
	}): Promise<{ result: string; variablesReference: number }> {
		const reply = await this.session.customRequest("evaluate", {
			expression: args.expression,
			frameId: args.frameId,
			context: args.context,
		});
		return {
			result: reply.result,
			variablesReference: this.isJsonString(reply.result) ? 0 : reply.variablesReference,
		};
	}
	
	private isJsonString(str: string) {
		try {
			if (this.isEnclosedWith(str, '"') || this.isEnclosedWith(str, "'")) str = str.substring(1, str.length - 1);
			JSON.parse(str);
		} catch (e) {}
		return true;
	}
	
	private isEnclosedWith(str: string, char: string): boolean {
		return str.startsWith(char) && str.endsWith(char);
	}
}

export interface StackTraceInfo {
	totalFrames?: number;
	stackFrames: StackFrame[];
}

interface Scope {
	name: string;
	expensive: boolean;
	variablesReference: number;
}

interface Variable {
	name: string;
	value: string;
	variablesReference: number;
}

export interface StackFrame {
	id: number;
	name: string;
	source: { name: string; path: string };
}
