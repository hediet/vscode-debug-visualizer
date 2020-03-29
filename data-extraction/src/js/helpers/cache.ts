import { DataExtractorApiImpl } from "../api";

const cached = new Map<string, any>();

/**
 * Evaluates an expression
 */
export function cache<T>(
	expression: string | (() => T),
	id: string | number | undefined = undefined
): T {
	let resultFn: () => any;
	let key: string;
	if (typeof expression === "string") {
		const evalFn = DataExtractorApiImpl.lastEvalFn!;
		resultFn = () => evalFn(expression);
		key = JSON.stringify({ expr: expression, id });
	} else {
		resultFn = () => expression();
		key = JSON.stringify({ expr: expression.toString(), id });
	}

	if (cached.has(key)) {
		return cached.get(key);
	}

	const result = resultFn();
	cached.set(key, result);

	return result;
}
