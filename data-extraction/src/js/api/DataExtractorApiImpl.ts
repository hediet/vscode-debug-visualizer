import {
	DataExtractorApi,
	DataResult,
	JSONString,
	DataExtractor,
	DataExtraction,
	ExtractionCollector,
	DataExtractorContext,
} from "./DataExtractorApi";
import {
	DataExtractorInfo,
	VisualizationData,
} from "../../DataExtractionResult";
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
		class ContextImpl implements DataExtractorContext {
			constructor(
				public readonly variablesInScope: Record<string, () => unknown>,
				public readonly expression: string | undefined,
				public readonly evalFn: <T>(expression: string) => T,
				private readonly _api: DataExtractorApiImpl,
				private readonly _parent: ContextImpl | undefined
			) {}

			get _level(): number {
				return this._parent ? this._parent._level + 1 : 0;
			}

			extract(value: any): VisualizationData | undefined {
				if (this._level > 10) {
					throw new Error(
						"extract() called too many times recursively"
					);
				}

				const extractions = this._api.getExtractions(
					value,
					new ContextImpl(
						this.variablesInScope,
						undefined,
						this.evalFn,
						this._api,
						this
					)
				);
				if (extractions.length === 0) {
					return undefined;
				}
				return extractions[0].extractData();
			}
		}

		const rootContext = new ContextImpl(
			variablesInScope,
			removeEnd(removeStart(valueFn.toString(), "() => ("), ")").trim(),
			evalFn,
			this,
			undefined
		);

		DataExtractorApiImpl.lastContext = rootContext;
		const value = valueFn();
		const extractions = this.getExtractions(value, rootContext);
		DataExtractorApiImpl.lastContext = undefined;

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
				id: e.id! as any,
				name: e.name!,
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

	public getExtractions(
		value: unknown,
		context: DataExtractorContext
	): DataExtraction[] {
		const extractions = new Array<DataExtraction>();
		const extractors = new Array<DataExtractor>();

		for (const fn of this.extractorSources.values()) {
			fn((extractor) => {
				extractors.push(extractor);
			}, helpers);
		}

		for (const e of [...this.extractors.values(), ...extractors]) {
			if (e.dataCtor !== undefined) {
				if (
					typeof value !== "object" ||
					value === null ||
					value.constructor.name !== e.dataCtor
				) {
					continue;
				}
			}
			e.getExtractions(
				value,
				{
					addExtraction(extraction) {
						if (extraction.id === undefined) {
							extraction.id = e.id;
						}
						if (extraction.name === undefined) {
							extraction.name = e.id;
						}
						extractions.push(extraction);
					},
				},
				context
			);
		}
		extractions.sort((a, b) => b.priority - a.priority);

		return extractions;
	}

	public registerDefaultExtractors(preferExisting: boolean = false): void {
		// TODO consider preferExisting
		registerDefaultExtractors(this);
	}

	public setDataExtractorFn(
		id: string,
		fn: LoadDataExtractorsFn | undefined
	): void {
		if (fn) {
			this.extractorSources.set(id, fn);
		} else {
			this.extractorSources.delete(id);
		}
	}
}

function removeStart(str: string, start: string): string {
	if (str.startsWith(start)) {
		return str.substr(start.length);
	}
	return str;
}

function removeEnd(str: string, end: string): string {
	if (str.endsWith(end)) {
		return str.substr(0, str.length - end.length);
	}
	return str;
}
