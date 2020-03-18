import {
	contract,
	notificationContract,
	types,
	requestContract,
} from "@hediet/typed-json-rpc";
import {
	DataExtractionResult,
	DataExtractorId,
} from "@hediet/debug-visualizer-data-extraction";

function unchecked<T>(): types.Type<T, any, unknown> {
	return new types.Type<T, T, unknown>(
		"unchecked",
		(u): u is T => true,
		value => types.success(value as T),
		value => value
	);
}

export type FormattedMessage =
	| string
	| {
			kind: "list";
			items: FormattedMessage[];
	  }
	| {
			kind: "inlineList";
			items: FormattedMessage[];
	  }
	| {
			kind: "code";
			content: string;
	  };

export type DataExtractionState =
	| { kind: "loading" }
	| { kind: "error"; message: FormattedMessage }
	| { kind: "noDebugSession" }
	| {
			kind: "data";
			result: DataExtractionResult;
	  };

// https://microsoft.github.io/debug-adapter-protocol/specification#CompletionItem
type CompletionItemType =
	| "method"
	| "function"
	| "constructor"
	| "field"
	| "variable"
	| "class"
	| "interface"
	| "module"
	| "property"
	| "unit"
	| "value"
	| "enum"
	| "keyword"
	| "snippet"
	| "text"
	| "color"
	| "file"
	| "reference"
	| "customcolor";

export interface CompletionItem {
	/**
	 * The label of this completion item. By default this is also the text that is inserted when selecting this completion.
	 */
	label: string;

	/**
	 * If text is not falsy then it is inserted instead of the label.
	 */
	text?: string;

	/**
	 * The item's type. Typically the client uses this information to render the item in the UI with an icon.
	 */
	type?: CompletionItemType;

	/**
	 * This value determines the location (in the CompletionsRequest's 'text' attribute) where the completion text is added.
	 * If missing the text is added at the location specified by the CompletionsRequest's 'column' attribute.
	 */
	start?: number;

	/**
	 * This value determines how many characters are overwritten by the completion text.
	 * If missing the value 0 is assumed which results in the completion text being inserted.
	 */
	length?: number;
}

export const debugVisualizerUIContract = contract({
	client: {
		updateState: notificationContract({
			params: types.type({
				newState: unchecked<DataExtractionState>(),
			}),
		}),
	},
	server: {
		authenticate: requestContract({
			params: types.type({
				secret: types.string,
			}),
		}),
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

		getCompletions: requestContract({
			params: types.type({
				text: types.string,
				column: types.number,
			}),
			result: types.type({
				completions: types.array(unchecked<CompletionItem>()),
			}),
		}),
	},
});
