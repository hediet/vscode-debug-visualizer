import { getDataExtractorApi } from "@hediet/debug-visualizer-data-extraction";

// Registers all existing extractors.
getDataExtractorApi().registerDefaultExtractors();

getDataExtractorApi().registerExtractor({
	id: "my-extractor",
	getExtractions: (data, collector) => {
		if (data instanceof Foo) {
			collector.addExtraction({
				id: "my-extractor",
				name: "My Extractor",
				priority: 2000,
				extractData: () => ({ kind: { text: true }, text: "Foo" }),
			});
		}
	},
});

setTimeout(() => {
	new Main().run();
}, 0);

class Foo {}

class Main {
	run() {
		const f = new Foo();
		// visualize `f` here!
		debugger;
	}
}
