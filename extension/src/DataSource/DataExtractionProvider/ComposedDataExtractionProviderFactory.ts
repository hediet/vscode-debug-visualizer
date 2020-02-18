import {
	DataExtractionProviderFactory,
	DataExtractionProvider,
} from "./DataExtractionProvider";
import { VsCodeDebugSession } from "../../VsCodeDebugger";

export class ComposedDataExtractionProviderFactory
	implements DataExtractionProviderFactory {
	constructor(public readonly factories: DataExtractionProviderFactory[]) {}

	createDataExtractionProvider(
		session: VsCodeDebugSession
	): DataExtractionProvider | undefined {
		for (const f of this.factories) {
			const provider = f.createDataExtractionProvider(session);
			if (provider) {
				return provider;
			}
		}
		return undefined;
	}
}
