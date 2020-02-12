import {
	DataExtractorApi,
	DataResult,
	JSONString,
	DataExtractor,
	DataExtraction,
	ExtractionCollector,
} from "./DataExtractorApi";
import { ExtractedData, DataExtractorInfo } from "../../DataExtractionResult";
import { registerDefaultDataExtractors } from "./default-extractors";

export class DataExtractorApiImpl implements DataExtractorApi {
	private readonly extractors = new Map<
		string,
		DataExtractor<ExtractedData>
	>();

	private toJson<TData>(data: TData): JSONString<TData> {
		return JSON.stringify(data) as any;
	}

	public registerExtractor<TExtractedData extends ExtractedData>(
		extractor: DataExtractor<TExtractedData>
	): void {
		this.extractors.set(extractor.id, extractor);
	}

	public registerExtractors(
		extractors: DataExtractor<ExtractedData>[]
	): void {
		for (const e of extractors) {
			this.registerExtractor(e);
		}
	}

	public getData(
		value: unknown,
		evalFn: <T>(expression: string) => T,
		preferredDataExtractorId: string | undefined
	): JSONString<DataResult> {
		const extractions = new Array<DataExtraction<ExtractedData>>();
		const extractionCollector: ExtractionCollector<ExtractedData> = {
			addExtraction(extraction) {
				extractions.push(extraction);
			},
		};

		for (const e of this.extractors.values()) {
			e.getExtractions(value, extractionCollector, { evalFn });
		}
		extractions.sort((a, b) => b.priority - a.priority);
		let usedExtraction = extractions[0];
		if (!usedExtraction) {
			return this.toJson({ kind: "NoExtractors" } as DataResult);
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
		registerDefaultDataExtractors(this);
	}
}
