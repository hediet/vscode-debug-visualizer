import { contract, notificationContract, types } from "@hediet/typed-json-rpc";
import {
	DataExtractionResult,
	DataExtractorId,
} from "@hediet/debug-visualizer-data-extraction";

function unchecked<T>(): types.Type<T, T, unknown> {
	return new types.Type<T, T, unknown>(
		"unchecked",
		(u): u is T => true,
		value => types.success(value as T),
		value => value
	);
}

export type DataExtractionState =
	| { kind: "loading" }
	| { kind: "error"; message: string }
	| { kind: "noDebugSession" }
	| {
			kind: "data";
			result: DataExtractionResult;
	  };

export const debugVisualizerUIContract = contract({
	client: {
		updateState: notificationContract({
			params: types.type({
				newState: unchecked<DataExtractionState>(),
			}),
		}),
	},
	server: {
		setPreferredDataExtractor: notificationContract({
			params: types.type({
				dataExtractorId: unchecked<DataExtractorId>(),
			}),
		}),
		setExpression: notificationContract({
			params: types.type({
				newExpression: types.string,
			}),
		}),
		refresh: notificationContract({}),
		openInBrowser: notificationContract({}),
	},
});
