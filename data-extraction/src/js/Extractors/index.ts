import { getDataExtractorApi } from "../DataExtractorApi";
import { TypeScriptAstDataExtractor } from "./TypeScriptDataExtractors";

export * from "./TypeScriptDataExtractors";

export function registerAll() {
	getDataExtractorApi().registerExtractor(new TypeScriptAstDataExtractor());
}
