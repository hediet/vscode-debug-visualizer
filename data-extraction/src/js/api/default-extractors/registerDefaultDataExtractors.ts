import { DataExtractorApi } from "../DataExtractorApi";
import { TypeScriptAstDataExtractor } from "./TypeScriptDataExtractors";
import { AsIsDataExtractor } from "./AsIsDataExtractor";
import { GetDebugVisualizationDataExtractor } from "./GetDebugVisualizationDataExtractor";
import { ToStringDataExtractor } from "./ToStringExtractor";
import { PlotDataExtractor } from "./PlotlyDataExtractor";

/**
 * The default data extractors should be registered by VS Code automatically.
 * Registering them manually ensures that they are up to date.
 */
export function registerDefaultDataExtractors(api: DataExtractorApi) {
	for (const item of [
		new TypeScriptAstDataExtractor(),
		new AsIsDataExtractor(),
		new GetDebugVisualizationDataExtractor(),
		new ToStringDataExtractor(),
		new PlotDataExtractor(),
	]) {
		api.registerExtractor(item);
	}
}
