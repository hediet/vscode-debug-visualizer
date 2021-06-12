import { DataExtractorApiImpl } from "../api";

export function find(predicate: (obj: unknown) => boolean): unknown {
	const processed = new Set();
	if (!DataExtractorApiImpl.lastVariablesInScope) {
		throw new Error("No variables in scope!");
	}

	const values = Object.values(DataExtractorApiImpl.lastVariablesInScope);
	const queue = [...values];

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
