import {
	DataExtractionResult,
	DataExtractorId,
} from "@hediet/debug-visualizer-data-extraction";
import { VsCodeDebugSession } from "../../VsCodeDebugger";
import {
	DataExtractionProviderFactory,
	DataExtractionProvider,
	DataExtractionProviderArgs,
} from "./DataExtractionProvider";
import { parseEvaluationResultFromGenericDebugAdapter } from "./parseEvaluationResultFromGenericDebugAdapter";
import { FormattedMessage } from "../../contract";
import { hotClass, registerUpdateReconciler } from "@hediet/node-reload";

registerUpdateReconciler(module);

@hotClass(module)
export class GenericDataExtractionProviderFactory
	implements DataExtractionProviderFactory {
	createDataExtractionProvider(
		session: VsCodeDebugSession
	): DataExtractionProvider | undefined {
		return new GenericDataExtractionProvider(session);
	}
}

export class GenericDataExtractionProvider implements DataExtractionProvider {
	constructor(private readonly session: VsCodeDebugSession) {}

	public async evaluate({
		expression,
		preferredExtractorId,
		frameId,
	}: DataExtractionProviderArgs): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
	> {
		const finalExpression = this.getFinalExpression({
			expression,
			preferredExtractorId,
		});
		let reply;
		try {
			reply = await this.session.evaluate({
				expression: finalExpression,
				frameId,
				context: this.getContext(),
			});
		} catch (error) {
			return {
				kind: "error",
				message: {
					kind: "list",
					items: [
						error.message,
						`Used debug adapter: ${this.session.session.configuration.type}`,
						{
							kind: "inlineList",
							items: [
								"Evaluated expression is",
								{ kind: "code", content: finalExpression },
							],
						},
					],
				},
			};
		}

		return parseEvaluationResultFromGenericDebugAdapter(reply.result);
	}

	protected getFinalExpression(args: {
		expression: string;
		preferredExtractorId: DataExtractorId | undefined;
	}): string {
		return args.expression;
	}

	protected getContext(): "watch" | "repl" {
		return "watch";
	}
}
