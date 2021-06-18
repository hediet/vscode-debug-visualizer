import {
	DataExtractor,
	ExtractionCollector,
	DataExtractorContext,
	LoadDataExtractorsFn,
} from "..";
import * as helpers from "../../helpers";

export class InjectedExtractor implements DataExtractor {
	readonly id = "injected-extractor";

	getExtractions(
		data: unknown,
		extractionCollector: ExtractionCollector,
		context: DataExtractorContext
	): void {
		const key = "@hediet/debug-visualizer/injectedScripts";
		const injectedExtractorsFns = Object.values(
			(global as any)[key]
		) as LoadDataExtractorsFn[];

		const extractors = new Array<DataExtractor>();

		for (const fn of injectedExtractorsFns) {
			fn(extractor => {
				extractors.push(extractor);
			}, helpers);
		}

		for (const extractor of extractors) {
			extractor.getExtractions(data, extractionCollector, context);
		}
	}
}
