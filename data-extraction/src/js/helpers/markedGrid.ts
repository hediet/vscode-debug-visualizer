import { GridVisualizationData } from "../../CommonDataTypes";

export function markedGrid(
	arr: unknown[],
	marked: Record<string, number | undefined>
): GridVisualizationData {
	return {
		kind: { grid: true },
		rows: [{ columns: arr.map(d => ({ content: "" + d, tag: "" + d })) }],
		markers: Object.entries(marked)
			.map(([key, val]) => ({
				id: "" + key,
				row: 0,
				column: val!,
			}))
			.filter(c => c.column !== undefined),
	};
}
