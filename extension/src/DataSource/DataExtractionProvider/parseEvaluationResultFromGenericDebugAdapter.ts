import {
	DataExtractionResult,
	isExtractedData,
} from "@hediet/debug-visualizer-data-extraction";

export function parseEvaluationResultFromGenericDebugAdapter(
	resultText: string
):
	| { kind: "data"; result: DataExtractionResult }
	| { kind: "error"; message: string } {
	const jsonData = resultText.trim();

	let resultObj;
	try {
		try {
			let jsonData2;
			// Remove optionally enclosing characters.
			if (
				isEnclosedWith(jsonData, '"') ||
				isEnclosedWith(jsonData, "'")
			) {
				// In case of JavaScript: `"{ "kind": { ... }, "text": "some\ntext" }"`
				jsonData2 = jsonData.substr(1, jsonData.length - 2);
			} else {
				// Just in case no quoting is done.
				jsonData2 = jsonData;
			}
			resultObj = parseJson(jsonData2);
		} catch (e) {
			// in case of C++: `"{ \"kind\": { ... }, \"text\": \"some\\ntext\" }"`
			const str = parseJson(jsonData);
			// str is now `{ "kind": { ... }, "text": "some\ntext" }"`
			resultObj = parseJson(str);
			// result is now { kind: { ... }, text: "some\ntext" }
		}

		if (!isExtractedData(resultObj)) {
			return {
				kind: "error",
				message: "Data does not match ExtractedData interface.",
			};
		}
	} catch (e) {
		return {
			kind: "error",
			message: e.message,
		};
	}

	return {
		kind: "data",
		result: {
			availableExtractors: [],
			usedExtractor: {
				id: "generic" as any,
				name: "Generic",
				priority: 1,
			},
			data: resultObj,
		},
	};
}

function isEnclosedWith(str: string, char: string): boolean {
	return str.startsWith(char) && str.endsWith(char);
}

function parseJson(str: string) {
	try {
		return JSON.parse(str);
	} catch (error) {
		throw new Error(
			`Could not parse \`${str}\` as JSON.\n${error.message}`
		);
	}
}
