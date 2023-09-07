import {
	DataExtractorInfo,
	VisualizationData,
} from "../../DataExtractionResult";
import * as helpers from "../helpers";
import {
	CallFrameInfo,
	CallFrameRequest,
	CallFramesSnapshot,
	DataExtraction,
	DataExtractor,
	DataExtractorApi,
	DataExtractorContext,
	DataResult,
	JSONString,
	SkippedCallFrames,
} from "./DataExtractorApi";
import { LoadDataExtractorsFn } from "./LoadDataExtractorsFn";
import { registerDefaultExtractors } from "./default-extractors";

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
		variablesInScope: Record<string, () => unknown>,
		callFramesSnapshot: CallFramesSnapshot | null
	): JSONString<DataResult> {
		const callFrameRequests: CallFrameRequest[] = [];
		const rootContext = new ContextImpl(
			variablesInScope,
			removeEnd(removeStart(valueFn.toString(), "() => ("), ")").trim(),
			evalFn,
			this,
			undefined,
			callFramesSnapshot?.frames ?? [],
			callFrameRequests
		);

		DataExtractorApiImpl.lastContext = rootContext;
		const value = valueFn();
		const extractions = this.getExtractions(value, rootContext);
		DataExtractorApiImpl.lastContext = undefined;

		const requestId =
			callFrameRequests.length === 0
				? ""
				: "" + cyrb53(JSON.stringify(callFrameRequests));
		if ((callFramesSnapshot?.requestId ?? "") !== requestId) {
			return this.toJson({
				kind: "OutdatedCallFrameSnapshot",
				callFramesRequest: {
					requestId,
					requestedCallFrames: callFrameRequests,
				},
			});
		}

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

function mapExtractor(e: DataExtraction): DataExtractorInfo {
	return {
		id: e.id! as any,
		name: e.name!,
		priority: e.priority,
	};
}

class ContextImpl implements DataExtractorContext {
	constructor(
		public readonly variablesInScope: Record<string, () => unknown>,
		public readonly expression: string | undefined,
		public readonly evalFn: <T>(expression: string) => T,
		private readonly _api: DataExtractorApiImpl,
		private readonly _parent: ContextImpl | undefined,
		public readonly callFrameInfos: readonly (
			| CallFrameInfo
			| SkippedCallFrames
		)[],
		private readonly _callFrameRequests: CallFrameRequest[]
	) {}

	addCallFrameRequest(request: CallFrameRequest): void {
		this._callFrameRequests.push(request);
	}

	get _level(): number {
		return this._parent ? this._parent._level + 1 : 0;
	}

	extract(value: any): VisualizationData | undefined {
		if (this._level > 10) {
			throw new Error("extract() called too many times recursively");
		}

		const extractions = this._api.getExtractions(
			value,
			new ContextImpl(
				this.variablesInScope,
				undefined,
				this.evalFn,
				this._api,
				this,
				this.callFrameInfos,
				this._callFrameRequests
			)
		);
		if (extractions.length === 0) {
			return undefined;
		}
		return extractions[0].extractData();
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

// From https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
function cyrb53(str: string, seed = 0) {
	let h1 = 0xdeadbeef ^ seed,
		h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
	h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
	h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
