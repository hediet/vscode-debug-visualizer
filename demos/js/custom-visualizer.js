// @ts-check
/**
 * @type {import("@hediet/debug-visualizer-data-extraction").LoadDataExtractorsFn}
 */
 module.exports = (register, helpers) => {
	register({
		id: "map",
		getExtractions(data, collector, context) {
			if (!(data instanceof Map)) {
				return;
			}

			collector.addExtraction({
				priority: 1000,
				id: "map",
				name: "Map",
				extractData() {
					return helpers.asData({
						kind: { table: true },
						rows: [...data].map(([k, v]) => ({ key: k, value: v }))
					});
				},
			});
		},
	});
	
	register({
		id: "binaryViewer",
		getExtractions(data, collector, context) {
			if (typeof data !== "number") {
				return;
			}
/*
			context.addCallFrameRequest({
				methodName: "Module._load",
				pathRegExp: ".*",
			});

			context.addCallFrameRequest({
				methodName: "LinkedList.insertAt",
				pathRegExp: ".*",
			});*/

			collector.addExtraction({
				priority: 10000,
				id: "binary",
				name: "Bits of Integer",
				extractData() {
					return context.extract(JSON.stringify(context.callFrameInfos, undefined, 4));
					
					return helpers.asData({
						kind: { text: true },
						text: data.toString(2),
					});
				},
			});
		},
	});
 };
