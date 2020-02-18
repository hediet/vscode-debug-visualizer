export * from "./DataExtractionProvider";

import { ComposedDataExtractionProviderFactory } from "./ComposedDataExtractionProviderFactory";
import { JsDataExtractionProviderFactory } from "./JsDataExtractionProviderFactory";
import { GenericDataExtractionProviderFactory } from "./GenericDataExtractionProviderFactory";

export const defaultDataExtractionProviderFactory = new ComposedDataExtractionProviderFactory(
	[
		new JsDataExtractionProviderFactory(),
		new GenericDataExtractionProviderFactory(),
	]
);
