import { DataExtractorApiImpl } from "../api/DataExtractorApiImpl";

/**
 * Takes an object and eval's its values.
 * Each successfully evaluated value is added to the result object,
 * its original key is used as key in the result object.
 *
 * # Example
 * ```
 * const x = 1;
 * tryEval({ val1: "x", val2: "x y" })
 * // -> { val1: 1 }
 * ```
 */
export function tryEval(obj: Record<string, string>): Record<string, unknown>;
/**
 * Takes an array of strings and eval's its items.
 * Each successfully evaluated value is added to the result object,
 * its original value is used as key.
 *
 * # Example
 * ```
 * const x = 1;
 * tryEval(["x", "y", "a a", "x + 2"])
 * // -> { x: 1, "x + 2": 3 }
 * ```
 */
export function tryEval(arr: string[]): Record<string, unknown>;
export function tryEval(
	obj: Record<string, string> | string[] | string
): Record<string, unknown> | unknown {
	const result: Record<string, unknown> = {};
	const evalFn = DataExtractorApiImpl.lastEvalFn!;
	if (Array.isArray(obj)) {
		for (const val of obj) {
			try {
				result[val] = evalFn(val);
			} catch (e) {}
		}
	} else {
		for (const [key, val] of Object.entries(obj)) {
			try {
				result[key] = evalFn(val);
			} catch (e) {}
		}
	}
	return result;
}
