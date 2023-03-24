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

export function findVar(
	options: { nameSimilarTo?: string; ctor?: string },
	predicate?: (value: any) => boolean
): unknown | undefined {
	if (!DataExtractorApiImpl.lastContext) {
		throw new Error("No data extractor context!");
	}

	let bestValue = undefined;
	let bestValueScore = undefined; // minimized

	for (const [name, value] of Object.entries(
		DataExtractorApiImpl.lastContext.variablesInScope
	)) {
		const v = value();
		if (options.ctor !== undefined) {
			if (
				typeof v !== "object" ||
				!v ||
				v.constructor.name !== options.ctor
			) {
				continue;
			}
		}
		if (predicate) {
			if (!predicate(v)) {
				continue;
			}
		}
		let score = 0;
		if (options.nameSimilarTo !== undefined) {
			score += similarityScore(name, options.nameSimilarTo);
		} else {
			return v;
		}
		if (bestValueScore === undefined || score < bestValueScore) {
			bestValue = v;
			bestValueScore = score;
		}
	}

	return bestValue;
}

function similarityScore(a: string, b: string): number {
	const distance = levenshteinDistance(a, b);

	const aSorted = a.split("").sort().join("");
	const bSorted = b.split("").sort().join("");
	const distance2 = levenshteinDistance(aSorted, bSorted);

	return distance * 10 + distance2;
}

function levenshteinDistance(a: string, b: string): number {
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;

	const matrix = [];

	// increment along the first column of each row
	let i;
	for (i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}

	// increment each column in the first row
	let j;
	for (j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	// Fill in the rest of the matrix
	for (i = 1; i <= b.length; i++) {
		for (j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) == a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					Math.min(
						matrix[i][j - 1] + 1, // insertion
						matrix[i - 1][j] + 1
					)
				); // deletion
			}
		}
	}

	return matrix[b.length][a.length];
}
