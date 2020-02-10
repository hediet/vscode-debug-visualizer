import { getDataExtractorApi } from "../DataExtractorApi";
import { TypeScriptAstDataExtractor } from "./TypeScriptDataExtractors";
import { AsIsDataExtractor } from "./AsIsDataExtractor";
import { GetDebugVisualizationDataExtractor } from "./GetDebugVisualizationDataExtractor";

/**
 * The default data extractors should be registered by vs code anyways.
 * This however ensures that the most up to date extractors are registered.
 */
export function registerDefaultDataExtractors() {
	const api = getDataExtractorApi();
	for (const item of [
		new TypeScriptAstDataExtractor(),
		new AsIsDataExtractor(),
		new GetDebugVisualizationDataExtractor(),
	]) {
		api.registerExtractor(item);
	}
}
