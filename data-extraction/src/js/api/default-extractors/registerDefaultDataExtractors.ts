import { DataExtractorApi } from "../DataExtractorApi";
import { TypeScriptAstDataExtractor } from "./TypeScriptDataExtractors";
import { AsIsDataExtractor } from "./AsIsDataExtractor";
import { GetVisualizationDataExtractor } from "./GetDebugVisualizationDataExtractor";
import { ToStringDataExtractor } from "./ToStringExtractor";
import { PlotlyDataExtractor } from "./PlotlyDataExtractor";
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
		new GetVisualizationDataExtractor(),
		new ToStringDataExtractor(),
		new PlotlyDataExtractor(),
		new ObjectGraphExtractor(),
		new GridExtractor(),
	]) {
		api.registerExtractor(item);
	}
}
