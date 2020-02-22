import { DataExtractorApi } from "../DataExtractorApi";
import { TypeScriptAstDataExtractor } from "./TypeScriptDataExtractors";
import { AsIsDataExtractor } from "./AsIsDataExtractor";
import { GetDebugVisualizationDataExtractor } from "./GetDebugVisualizationDataExtractor";
import { ToStringDataExtractor } from "./ToStringExtractor";
import { PlotDataExtractor } from "./PlotlyDataExtractor";
import { ObjectGraphExtractor } from "./ObjectGraphExtractor";
import { getDataExtractorApi } from "../injection";
import { GridExtractor } from "./GridExtractor";

/**
 * The default data extractors should be registered by VS Code automatically.
 * Registering them manually ensures that they are up to date.
 */
export function registerDefaultExtractors(
	api: DataExtractorApi = getDataExtractorApi()
) {
	for (const item of [
		new TypeScriptAstDataExtractor(),
		new AsIsDataExtractor(),
		new GetDebugVisualizationDataExtractor(),
		new ToStringDataExtractor(),
		new PlotDataExtractor(),
		new ObjectGraphExtractor(),
		new GridExtractor(),
	]) {
		api.registerExtractor(item);
	}
}
