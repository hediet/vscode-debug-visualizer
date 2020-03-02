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
		| { kind: "error"; message: string }
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
				message: error.message,
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
