import { CommonDataTypes } from "../../CommonDataTypes";

export function markedGrid(
	arr: any[],
	marked: Record<string, number>
): CommonDataTypes.Grid {
	return {
		kind: { array: true },
		rows: [{ columns: arr.map(d => ({ tag: d })) }],
		markers: Object.entries(marked).map(([key, val]) => ({
			id: key,
			row: 0,
			column: val,
		})),
	};
}
