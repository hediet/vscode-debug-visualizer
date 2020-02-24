import {
	DataResult,
	DataExtractionResult,
	ExtractedData,
	isExtractedData,
} from "@hediet/debug-visualizer-data-extraction";
import { VsCodeDebugSession } from "../../VsCodeDebugger";
import {
	DataExtractionProviderFactory,
	DataExtractionProvider,
	DataExtractionProviderArgs,
} from "./DataExtractionProvider";

export class GenericDataExtractionProviderFactory
	implements DataExtractionProviderFactory {
	createDataExtractionProvider(
		session: VsCodeDebugSession
	): DataExtractionProvider | undefined {
		return new GenericDataExtractionProvider(session);
	}
}

class GenericDataExtractionProvider implements DataExtractionProvider {
	constructor(private readonly session: VsCodeDebugSession) {}

	public async evaluate({
		expression,
		preferredExtractor,
		frameId,
	}: DataExtractionProviderArgs): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: string }
	> {
		try {
			const reply = await this.session.evaluate({
				expression,
				frameId,
			});

			function isEnclosedWith(str: string, char: string): boolean {
				return str.startsWith(char) && str.endsWith(char);
			}

			const jsonData = reply.result.trim();

			function parseJson(str: string) {
				try {
					return JSON.parse(str);
				} catch (error) {
					throw new Error(
						`Could not parse \`${str}\` as JSON.\n${error.message}`
					);
				}
			}

			let result;

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
				result = parseJson(jsonData2);
			} catch (e) {
				// in case of C++: `"{ \"kind\": { ... }, \"text\": \"some\\ntext\" }"`
				const str = parseJson(jsonData);
				// str is now `{ "kind": { ... }, "text": "some\ntext" }"`
				result = parseJson(str);
				// result is now { kind: { ... }, text: "some\ntext" }
			}

			if (!isExtractedData(result)) {
				throw new Error("Data does not match ExtractedData interface.");
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
					data: result,
				},
			};
		} catch (error) {
			return {
				kind: "error",
				message: error.message,
			};
		}
	}
}
