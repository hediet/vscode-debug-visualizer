import {
	DebugSessionVisualizationSupport,
	VisualizationBackend,
} from "./VisualizationBackend";
import { DebugSessionProxy } from "../proxies/DebugSessionProxy";

export class ComposedVisualizationSupport
	implements DebugSessionVisualizationSupport {
	constructor(public readonly engines: DebugSessionVisualizationSupport[]) {}

	createBackend(
		session: DebugSessionProxy
	): VisualizationBackend | undefined {
		for (const f of this.engines) {
			const evaluator = f.createBackend(session);
			if (evaluator) {
				return evaluator;
			}
		}
		return undefined;
	}
}
