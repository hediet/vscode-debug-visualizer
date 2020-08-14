import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import { EnhancedDebugSession } from "../../debugger/EnhancedDebugSession";
import { EvaluationEngine, Evaluator } from "./EvaluationEngine";
import { Config, DebugAdapterConfig } from "../../Config";
import { GenericEvaluator } from "./GenericEvaluationEngine";
import { registerUpdateReconciler, hotClass } from "@hediet/node-reload";

registerUpdateReconciler(module);

@hotClass(module)
export class ConfiguredEvaluationEngine implements EvaluationEngine {
	constructor(private readonly config: Config) {}

	createEvaluator(session: EnhancedDebugSession): Evaluator | undefined {
		const config = this.config.getDebugAdapterConfig(session.session.type);
		if (!config) {
			return undefined;
		}
		return new ConfiguredEvaluator(session, config);
	}
}

class ConfiguredEvaluator extends GenericEvaluator {
	constructor(
		session: EnhancedDebugSession,
		private readonly config: DebugAdapterConfig
	) {
		super(session);
	}

	protected getContext() {
		return this.config.context;
	}

	protected getFinalExpression({
		expression,
		preferredExtractorId,
	}: {
		expression: string;
		preferredExtractorId: DataExtractorId | undefined;
	}) {
		return this.config.getFinalExpression({
			expression,
			preferredExtractorId,
		});
	}
}
