import * as fs from "fs";
import { DataExtractorApi } from "./DataExtractorApi";
import { DataExtractorApiImpl } from "./DataExtractorApiImpl";
import * as helpers from "../helpers";
import * as globalHelpers from "../global-helpers";

/**
 * Returns standalone JS code representing an expression that initializes the data extraction API.
 * This expression returns nothing.
 * This function is called in the VS Code extension, the expression is evaluated in the debugee.
 */
export function getExpressionToInitializeDataExtractorApi(): string {
	const _fs = require("fs") as typeof fs;
	const moduleSrc = _fs.readFileSync(__filename, { encoding: "utf8" });
	return `((function () {
		let module = {};
		${moduleSrc}
		return module.exports.getDataExtractorApi();
	})())`;
}

/**
 * Returns standalone JS code representing an expression returns the data extraction API.
 * This expression returns an object of type `DataExtractorApi`.
 * If the API must be initialized with `getExpressionToInitializeDataExtractorApi()`,
 * it throws an exception containing the text of `ApiHasNotBeenInitializedCode`.
 * This function is called in the VS Code extension, the expression is evaluated in the debugee.
 */
export function getExpressionForDataExtractorApi(): string {
	return `((${selfContainedGetInitializedDataExtractorApi.toString()})())`;
}

const apiKey = "@hediet/data-extractor-api/v2";

export function getDataExtractorApi(): DataExtractorApi {
	installHelpers();
	const globalObj =
		typeof window === "object" ? (window as any) : (global as any);
	if (!globalObj[apiKey]) {
		globalObj[apiKey] = new DataExtractorApiImpl();
	}
	return globalObj[apiKey];
}

/**
 * This code is used to detect if the API has not been initialized yet.
 * @internal
 */
export const ApiHasNotBeenInitializedCode = "EgH0cybXij1jYUozyakO" as const;

/**
 * @internal
 */
function selfContainedGetInitializedDataExtractorApi(): DataExtractorApi {
	const globalObj =
		typeof window === "object" ? (window as any) : (global as any);
	const key: typeof apiKey = "@hediet/data-extractor-api/v2";
	let api: DataExtractorApi | undefined = globalObj[key];
	if (!api) {
		const code: typeof ApiHasNotBeenInitializedCode =
			"EgH0cybXij1jYUozyakO";
		throw new Error(
			`Data Extractor API has not been initialized. Code: ${code}`
		);
	}
	return api;
}

export function installHelpers(): void {
	const globalObj =
		typeof window === "object" ? (window as any) : (global as any);
	// `hediet` as prefix to avoid name collision (I own `hediet.de`).
	globalObj["hedietDbgVis"] = { ...helpers, ...globalHelpers };
}
