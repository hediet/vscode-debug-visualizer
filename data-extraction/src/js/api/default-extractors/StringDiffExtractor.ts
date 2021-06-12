import { DataExtractor, DataExtractorContext, ExtractionCollector } from "../..";

export class StringDiffExtractor implements DataExtractor {
    public readonly id = "string-diff";

    public getExtractions(data: unknown,
		collector: ExtractionCollector,
		context: DataExtractorContext) {
        if (Array.isArray(data) && data.length === 2 && typeof data[0] === "string" && typeof data[1] === "string") {
            collector.addExtraction({
                id: "string-diff",
                name: "String Diff",
                priority: 1000,
                extractData: () => ({
                    kind: { text: true },
                    text: data[0],
                    otherText: data[1]
                })
            })
        }
    }
}