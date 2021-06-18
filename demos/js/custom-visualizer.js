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
 };




/*
 register({
	id: "binaryViewer",
	getExtractions(data, collector, context) {
		if (typeof data !== "number") {
			return;
		}

		collector.addExtraction({
			priority: 100,
			id: "binary",
			name: "Bits of Integer",
			extractData() {
				return helpers.asData({
					kind: { text: true },
					text: data.toString(2),
				});
			},
		});
	},
});

*/

(register, helpers) => {
	register({
		id: "positionOrRangeInTextModel",
		getExtractions(data, collector, context) {
			collector.addExtraction({
				priority: 100,
				id: "foo",
				name: "Foo",
				extractData() {
					return helpers.asData({
						kind: { text: true },
						text: Object.keys(context.variablesInScope).join(", "),
					});
				},
			});
		},
	});

	register({
		id: "positionOrRangeInTextModel",
		getExtractions(data, collector, context) {
			/** @type {{ start: { line: number; column: number; }; end: { line: number; column: number; }; }} */
			let range;
			if (isRange(data)) {
				range = {
					start: {
						line: data.startLineNumber - 1,
						column: data.startColumn - 1,
					},
					end: {
						line: data.endLineNumber - 1,
						column: data.endColumn - 1,
					},
				};
			} else if (isPosition(data)) {
				range = {
					start: {
						line: data.lineNumber - 1,
						column: data.column - 1,
					},
					end: { line: data.lineNumber - 1, column: data.column - 1 },
				};
			} else {
				return;
			}

			if (!isRange(data) && !isPosition(data)) {
				return;
			}

			/** @type {any} */
			const textModel = helpers.find(
				x =>
					typeof x === "object" &&
					!!x &&
					"constructor" in x &&
					x.constructor.name === "TextModel"
			);

			collector.addExtraction({
				id: "positionOrRangeInTextModel",
				name: "Position/Range In TextModel",
				extractData() {
					return helpers.asData({
						kind: { text: true },
						text: textModel.getValue(),
						decorations: [{ range }],
					});
				},
				priority: 1000,
			});
		},
	});
};

/**
 * @return {value is { startColumn: number; startLineNumber: number; endColumn: number; endLineNumber: number; }}
 */
function isRange(value) {
	return (
		typeof value === "object" &&
		!!value &&
		"startColumn" in value &&
		"startLineNumber" in value
	);
}

/**
 * @return {value is { column: number; lineNumber: number }}
 */
function isPosition(value) {
	return (
		typeof value === "object" &&
		!!value &&
		"column" in value &&
		"lineNumber" in value
	);
}
