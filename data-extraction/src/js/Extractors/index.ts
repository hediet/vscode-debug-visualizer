import { getDataExtractorApi } from "../DataExtractorApi";
import { TypeScriptAstDataExtractor } from "./TypeScriptDataExtractors";
import { AsIsDataExtractor } from "./AsIsDataExtractor";

export * from "./TypeScriptDataExtractors";

export function registerAll() {
	const api = getDataExtractorApi();
	for (const item of [
		new TypeScriptAstDataExtractor(),
		new AsIsDataExtractor(),
	]) {
		api.registerExtractor(item);
	}
}
