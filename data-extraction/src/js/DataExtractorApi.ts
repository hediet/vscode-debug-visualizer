import {
	ExtractedData,
	DataExtractionResult,
	DataExtractorInfo,
} from "../DataExtractionResult";
import {
	DataExtractor,
	DataExtraction,
	ExtractionCollector,
} from "./DataExtractor";

export interface DataExtractorApi {
	/**
	 * Registers a single extractor.
	 * @preferExisting if `true`, an existing extractor is not overwritten.
	 */
	registerExtractor<TExtractedData extends ExtractedData>(
		extractor: DataExtractor<TExtractedData>,
		preferExisting?: boolean
	): void;

	/**
	 * Registers multiple extractors.
	 * @preferExisting if `true`, an existing extractor is not overwritten.
	 */
	registerExtractors(
		extractors: DataExtractor<ExtractedData>[],
		preferExisting?: boolean
	): void;

	/**
	 * Extracts data from `value`.
	 */
	getData(
		value: unknown,
		evalFn: <T>(expression: string) => T,
		preferredDataExtractorId: string | undefined
	): JSONString<DataResult>;
}

export type DataResult =
	| {
			kind: "Data";
			extractionResult: DataExtractionResult;
	  }
	| { kind: "NoExtractors" }
	| { kind: "Error"; message: string };

export interface JSONString<T> extends String {
	__brand: { json: T };
}

declare const window: any;

/**
 * @internal
 */
export function selfContainedInitDataExtractorApi(): boolean {
	const globalObj =
		typeof window === "object" ? (window as any) : (global as any);
	const key = "@hediet/data-extractor/v1";
	const prefix = key + "::";

	let api: DataExtractorApi | undefined = globalObj[key];
	if (api) {
		return false;
	}

	function toJson<TData>(data: TData): JSONString<TData> {
		return JSON.stringify(data) as any;
	}
	function getExtractors(): DataExtractor<ExtractedData>[] {
		return Object.entries(globalObj)
			.filter(([key, value]) => key.startsWith(prefix))
			.map(([key, value]) => value as DataExtractor<ExtractedData>);
	}
	globalObj["$asData"] = (x: unknown) => x;
	globalObj[key] = api = {
		registerExtractor(extractor, preferExisting) {
			const key = prefix + extractor.id;
			if (preferExisting && key in globalObj) {
				// don't overwrite existing data extractor
				return;
			}
			globalObj[key] = extractor;
		},
		registerExtractors(
			extractors: DataExtractor<ExtractedData>[],
			preferExisting
		) {
			for (const e of extractors) {
				this.registerExtractor(e, preferExisting);
			}
		},
		getData(value, evalFn, preferredDataExtractorId) {
			const extractions = new Array<DataExtraction<ExtractedData>>();
			const extractionCollector: ExtractionCollector<ExtractedData> = {
				addExtraction(extraction) {
					extractions.push(extraction);
				},
			};

			for (const e of getExtractors()) {
				e.getExtractions(value, extractionCollector, { evalFn });
			}
			extractions.sort((a, b) => b.priority - a.priority);
			let usedExtraction = extractions[0];
			if (!usedExtraction) {
				return toJson({ kind: "NoExtractors" } as DataResult);
			}

			if (preferredDataExtractorId) {
				const preferred = extractions.find(
					e => e.id === preferredDataExtractorId
				);
				if (preferred) {
					usedExtraction = preferred;
				}
			}

			function mapExtractor(
				e: DataExtraction<ExtractedData>
			): DataExtractorInfo {
				return {
					id: e.id as any,
					name: e.name,
					priority: e.priority,
				};
			}

			const data = usedExtraction.extractData();
			return toJson({
				kind: "Data",
				extractionResult: {
					data,
					usedExtractor: mapExtractor(usedExtraction),
					availableExtractors: extractions.map(mapExtractor),
				},
			} as DataResult);
		},
	};

	api.registerExtractor({
		id: "to-string",
		getExtractions: (data, collector) => {
			collector.addExtraction({
				id: "to-string",
				name: "To String",
				priority: 100,
				extractData() {
					return {
						kind: {
							text: true,
						},
						text: "" + data,
					};
				},
			});
		},
	});
	return true;
}

/**
 * This code is used to detect if the API has not been initialized yet.
 * @internal
 */
export const ApiHasNotBeenInitializedCode = "EgH0cybXij1jYUozyakO" as const;

/**
 * @internal
 */
export function selfContainedGetInitializedDataExtractorApi(): DataExtractorApi {
	const obj = typeof window === "object" ? (window as any) : (global as any);
	const key = "@hediet/data-extractor/v1";
	let api: DataExtractorApi | undefined = obj[key];
	if (!api) {
		const code: typeof ApiHasNotBeenInitializedCode =
			"EgH0cybXij1jYUozyakO";
		throw new Error(
			`Data Extractor API has not been initialized. Code: ${code}`
		);
	}
	return api;
}

/**
 * Get the data extractor API.
 */
export function getDataExtractorApi(): DataExtractorApi {
	selfContainedInitDataExtractorApi();
	return selfContainedGetInitializedDataExtractorApi();
}
