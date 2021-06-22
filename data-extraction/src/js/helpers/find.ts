import { DataExtractorApiImpl } from "../api";

export function find(predicate: (obj: unknown) => boolean): unknown {
	const processed = new Set();
	if (!DataExtractorApiImpl.lastContext) {
		throw new Error("No data extractor context!");
	}

	const values = Object.values(
		DataExtractorApiImpl.lastContext.variablesInScope
	);
	const queue = [
		...values.map((v) => {
			try {
				return v();
			} catch (e) {
				return undefined;
			}
		}),
	];

	let i = 10000;
	while (i > 0) {
		i--;

		const top = queue.shift();
		processed.add(top);

		if (predicate(top)) {
			return top;
		}

		if (typeof top === "object" && top) {
			for (const val of Object.values(top)) {
				if (!processed.has(val)) {
					processed.add(val);
					queue.push(val);
				}
			}
		}
	}

	return undefined;
}
