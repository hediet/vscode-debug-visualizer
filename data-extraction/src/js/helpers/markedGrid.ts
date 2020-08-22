import { GridVisualizationData } from "../../CommonDataTypes";

export function markedGrid(
	arr: any[],
	marked: Record<string, number>
): GridVisualizationData {
	return {
		kind: { grid: true },
		rows: [{ columns: arr.map(d => ({ tag: d })) }],
		markers: Object.entries(marked).map(([key, val]) => ({
			id: key,
			row: 0,
			column: val,
		})),
	};
}
