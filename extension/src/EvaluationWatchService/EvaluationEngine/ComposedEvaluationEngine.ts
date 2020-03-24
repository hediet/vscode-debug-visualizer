import { EvaluationEngine, Evaluator } from "./EvaluationEngine";
import { VsCodeDebugSession } from "../../VsCodeDebugger";

export class ComposedEvaluationEngine implements EvaluationEngine {
	constructor(public readonly engines: EvaluationEngine[]) {}

	createEvaluator(session: VsCodeDebugSession): Evaluator | undefined {
		for (const f of this.engines) {
			const evaluator = f.createEvaluator(session);
			if (evaluator) {
				return evaluator;
			}
		}
		return undefined;
	}
}
