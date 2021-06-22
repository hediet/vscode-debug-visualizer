import {
	DataExtractorApi,
	DataResult,
	JSONString,
	DataExtractor,
	DataExtraction,
	ExtractionCollector,
	DataExtractorContext,
} from "./DataExtractorApi";
import { DataExtractorInfo } from "../../DataExtractionResult";
import { registerDefaultExtractors } from "./default-extractors";
import { LoadDataExtractorsFn } from "./LoadDataExtractorsFn";
import * as helpers from "../helpers";

/**
 * @internal
 */
export class DataExtractorApiImpl implements DataExtractorApi {
	public static lastContext: DataExtractorContext | undefined = undefined;

	private readonly extractors = new Map<string, DataExtractor>();
	private readonly extractorSources = new Map<string, LoadDataExtractorsFn>();

	private toJson<TData>(data: TData): JSONString<TData> {
		return JSON.stringify(data) as any;
	}

	public registerExtractor(extractor: DataExtractor): void {
		this.extractors.set(extractor.id, extractor);
	}

	public registerExtractors(extractors: DataExtractor[]): void {
		for (const e of extractors) {
			this.registerExtractor(e);
		}
	}

	public getData(
		valueFn: () => unknown,
		evalFn: <T>(expression: string) => T,
		preferredDataExtractorId: string | undefined,
		variablesInScope: Record<string, () => unknown>
	): JSONString<DataResult> {
		const extractions = new Array<DataExtraction>();
		const extractionCollector: ExtractionCollector = {
			addExtraction(extraction) {
				extractions.push(extraction);
			},
		};

		const context: DataExtractorContext = {
			evalFn,
			variablesInScope,
		};

		DataExtractorApiImpl.lastContext = context;
		const value = valueFn();

		const extractors = new Array<DataExtractor>();

		for (const fn of this.extractorSources.values()) {
			fn((extractor) => {
				extractors.push(extractor);
			}, helpers);
		}

		for (const e of [...this.extractors.values(), ...extractors]) {
			e.getExtractions(value, extractionCollector, context);
		}

		DataExtractorApiImpl.lastContext = undefined;

		extractions.sort((a, b) => b.priority - a.priority);
		let usedExtraction = extractions[0];
		if (!usedExtraction) {
			return this.toJson({ kind: "NoExtractors" } as DataResult);
		}

		if (preferredDataExtractorId) {
			const preferred = extractions.find(
				(e) => e.id === preferredDataExtractorId
			);
			if (preferred) {
				usedExtraction = preferred;
			}
		}

		function mapExtractor(e: DataExtraction): DataExtractorInfo {
			return {
				id: e.id as any,
				name: e.name,
				priority: e.priority,
			};
		}

		const data = usedExtraction.extractData();
		return this.toJson({
			kind: "Data",
			extractionResult: {
				data,
				usedExtractor: mapExtractor(usedExtraction),
				availableExtractors: extractions.map(mapExtractor),
			},
		} as DataResult);
	}

	public registerDefaultExtractors(preferExisting: boolean = false): void {
		// TODO consider preferExisting
		registerDefaultExtractors(this);
	}

	public registerDataExtractorsSource(
		id: string,
		fn: LoadDataExtractorsFn
	): void {
		this.extractorSources.set(id, fn);
	}

	public unregisterDataExtractorsSource(id: string): void {
		this.extractorSources.delete(id);
	}
}
