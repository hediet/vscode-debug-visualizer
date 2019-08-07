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

export type DataResult =
	| {
			kind: "Data";
			extractionResult: DataExtractionResult;
	  }
	| { kind: "NoExtractors" };

export interface JSONString<T> extends String {
	__brand: { json: T };
}

export interface DataExtractorApi {
	registerExtractor<TExtractedData extends ExtractedData>(
		extractor: DataExtractor<TExtractedData>
	): void;
	getData(
		value: unknown,
		evalFn: <T>(expression: string) => T,
		preferredDataExtractorId: string | undefined
	): JSONString<DataResult>;
}

declare const window: any;

export function selfContainedInitDataExtractorApi(): boolean {
	const obj = typeof window === "object" ? (window as any) : (global as any);
	const key = "@hediet/data-extractor";
	const prefix = key + "::";

	let api: DataExtractorApi | undefined = obj[key];
	if (api) {
		return false;
	}

	function toJson<TData>(data: TData): JSONString<TData> {
		return JSON.stringify(data) as any;
	}
	function getExtractors(): DataExtractor<ExtractedData>[] {
		return Object.entries(obj)
			.filter(([key, value]) => key.startsWith(prefix))
			.map(([key, value]) => value as DataExtractor<ExtractedData>);
	}
	obj["$asData"] = (x: unknown) => x;
	obj[key] = api = {
		registerExtractor(extractor) {
			obj[prefix + extractor.id] = extractor;
		},
		getData(value, evalFn, preferredDataExtractorId) {
			const extractions = new Array<DataExtraction<ExtractedData>>();
			const collector: ExtractionCollector<ExtractedData> = {
				addExtraction(extraction) {
					extractions.push(extraction);
				},
			};
			for (const e of getExtractors()) {
				e.getExtractions(value, collector, evalFn);
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
		id: "toString",
		getExtractions(data, collector) {
			collector.addExtraction({
				id: "toString",
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

export const ApiHasNotBeenInitializedCode = "EgH0cybXij1jYUozyakO" as const;

export function selfContainedGetInitializedDataExtractorApi(): DataExtractorApi {
	const obj = typeof window === "object" ? (window as any) : (global as any);
	const key = "@hediet/data-extractor";
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

export function getDataExtractorApi(): DataExtractorApi {
	selfContainedInitDataExtractorApi();
	return selfContainedGetInitializedDataExtractorApi();
}
