import {
	getDataExtractorApi,
	DataExtractorApiImpl,
} from "@hediet/debug-visualizer-data-extraction";

describe("extractor", () => {
	it("should not crash", () => {
		const dataExtractor = new DataExtractorApiImpl();
		dataExtractor.registerDefaultExtractors();
		const result = dataExtractor.getData(
			() => [1, 2, 3],
			() => null!,
			undefined
		);
	});
});
