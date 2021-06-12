import { DataExtractorApi } from "../DataExtractorApi";
import { TypeScriptAstDataExtractor } from "./TypeScriptDataExtractors";
import { AsIsDataExtractor } from "./AsIsDataExtractor";
import { GetVisualizationDataExtractor } from "./GetDebugVisualizationDataExtractor";
import { ToStringDataExtractor } from "./ToStringExtractor";
import { PlotlyDataExtractor } from "./PlotlyDataExtractor";
import { ObjectGraphExtractor } from "./ObjectGraphExtractor";
import { getDataExtractorApi } from "../injection";
import { GridExtractor } from "./GridExtractor";
import { TableDataExtractor } from "./TableExtractor";
import { StringDiffExtractor } from "./StringDiffExtractor";
import { find } from "../../helpers";

/**
 * The default data extractors should be registered by VS Code automatically.
 * Registering them manually ensures that they are up to date.
 */
export function registerDefaultExtractors(
	api: DataExtractorApi = getDataExtractorApi()
) {
	for (const item of [
		new TypeScriptAstDataExtractor(),
		new AsIsDataExtractor(),
		new GetVisualizationDataExtractor(),
		new ToStringDataExtractor(),
		new PlotlyDataExtractor(),
		new ObjectGraphExtractor(),
		new GridExtractor(),
		new TableDataExtractor(),
		new StringDiffExtractor(),
	]) {
		api.registerExtractor(item);
	}

	function isRange(
		value: unknown
	): value is {
		startColumn: number;
		startLineNumber: number;
		endColumn: number;
		endLineNumber: number;
	} {
		return (
			typeof value === "object" &&
			!!value &&
			"startColumn" in value &&
			"startLineNumber" in value
		);
	}

	function isPosition(
		value: unknown
	): value is { column: number; lineNumber: number } {
		return (
			typeof value === "object" &&
			!!value &&
			"column" in value &&
			"lineNumber" in value
		);
	}

	//  hedietDbgVis.find(x => x.constructor.name === 'TextModel').getValue()
	api.registerExtractor({
		id: "positionInTextModel",
		getExtractions(data, collector, context) {
			let range: {
				start: {
					line: number;
					column: number;
				};
				end: {
					line: number;
					column: number;
				};
			};
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
					end: {
						line: data.lineNumber - 1,
						column: data.column - 1,
					},
				};
			} else {
				return;
			}

			if (!isRange(data) && !isPosition(data)) {
				return;
			}

			const textModel: any = find(
				x =>
					typeof x === "object" &&
					!!x &&
					"constructor" in x &&
					(x as any).constructor.name === "TextModel"
			);

			collector.addExtraction({
				id: "positionInTextModel",
				name: "Position In TextModel",
				extractData() {
					return {
						kind: { text: true },
						text: textModel.getValue(),
						decorations: [{ range }],
					};
				},
				priority: 1000,
			});
		},
	});
}
