import { DataExtractorId } from "@hediet/debug-visualizer-data-extraction";
import { VsCodeDebugSession } from "../../VsCodeDebugger";
import {
	DataExtractionProviderFactory,
	DataExtractionProvider,
} from "./DataExtractionProvider";
import { Config, DebugAdapterConfig } from "../../Config";
import { GenericDataExtractionProvider } from "./GenericDataExtractionProviderFactory";

export class ConfiguredDataExtractionProviderFactory
	implements DataExtractionProviderFactory {
	constructor(private readonly config: Config) {}

	createDataExtractionProvider(
		session: VsCodeDebugSession
	): DataExtractionProvider | undefined {
		const config = this.config.getDebugAdapterConfig(session.session.type);
		if (!config) {
			return undefined;
		}
		return new ConfiguredDataExtractionProvider(session, config);
	}
}

class ConfiguredDataExtractionProvider extends GenericDataExtractionProvider {
	constructor(
		session: VsCodeDebugSession,
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
