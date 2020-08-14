import { EvaluationEngine, Evaluator } from "./EvaluationEngine";
import { EnhancedDebugSession } from "../../debugger/EnhancedDebugSession";

export class ComposedEvaluationEngine implements EvaluationEngine {
	constructor(public readonly engines: EvaluationEngine[]) {}

	createEvaluator(session: EnhancedDebugSession): Evaluator | undefined {
		for (const f of this.engines) {
			const evaluator = f.createEvaluator(session);
			if (evaluator) {
				return evaluator;
			}
		}
		return undefined;
	}
}
