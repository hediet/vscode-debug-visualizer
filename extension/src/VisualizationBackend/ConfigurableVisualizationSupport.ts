import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import { DebugSessionProxy } from "../proxies/DebugSessionProxy";
import {
	DebugSessionVisualizationSupport,
	VisualizationBackend,
} from "./VisualizationBackend";
import { Config, DebugAdapterConfig } from "../Config";
import { GenericVisualizationBackend } from "./GenericVisualizationSupport";
import { registerUpdateReconciler, hotClass } from "@hediet/node-reload";
import { DebuggerViewProxy, FrameIdGetter } from "../proxies/DebuggerViewProxy";

registerUpdateReconciler(module);

@hotClass(module)
export class ConfigurableVisualizationSupport
	implements DebugSessionVisualizationSupport {
	constructor(
		private readonly config: Config,
		private readonly debuggerView: DebuggerViewProxy,
		private readonly frameIdGetter: FrameIdGetter
	) {}

	createBackend(
		session: DebugSessionProxy
	): VisualizationBackend | undefined {
		const config = this.config.getDebugAdapterConfig(session.session.type);
		if (!config) {
			return undefined;
		}
		return new ConfiguredVisualizationBackend(
			session,
			this.debuggerView,
			config,
			this.frameIdGetter
		);
	}
}

class ConfiguredVisualizationBackend extends GenericVisualizationBackend {
	constructor(
		debugSession: DebugSessionProxy,
		debuggerView: DebuggerViewProxy,
		private readonly config: DebugAdapterConfig,
		frameIdGetter: FrameIdGetter
	) {
		super(debugSession, debuggerView, frameIdGetter);
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
