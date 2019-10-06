import { getDataExtractorApi } from "../DataExtractorApi";
import { TypeScriptAstDataExtractor } from "./TypeScriptDataExtractors";
import { AsIsDataExtractor } from "./AsIsDataExtractor";
import { GetDebugVisualizationDataExtractor } from "./GetDebugVisualizationDataExtractor";

export {
	AsIsDataExtractor,
	TypeScriptAstDataExtractor,
	GetDebugVisualizationDataExtractor,
};

export function registerAll() {
	const api = getDataExtractorApi();
	for (const item of [
		new TypeScriptAstDataExtractor(),
		new AsIsDataExtractor(),
		new GetDebugVisualizationDataExtractor(),
	]) {
		api.registerExtractor(item);
	}
}
