import { EdgeGraphData, NodeGraphData, CommonDataTypes } from "../..";
import { createGraph } from ".";

/**
 * Given a labeled list of roots, it creates a graph by following their edges recursively.
 * Tracks cycles.
 */
export function createGraphFromPointers<T>(
	roots: Record<string, T | undefined | null>,
	infoSelector: (
		item: T
	) => {
		id?: string | number;
		edges: ({ to: T } & Omit<EdgeGraphData, "from" | "to">)[];
	} & Omit<NodeGraphData, "id">
): CommonDataTypes.Graph {
	const marker = {};

	interface Pointer {
		marker: {};
		name: string;
		value: T | null | undefined;
	}

	const items = Object.entries(roots).map<Pointer>(([name, value]) => ({
		marker,
		name,
		value,
	}));

	return createGraph<T | Pointer>(items, item => {
		if ("marker" in item && item["marker"] === marker) {
			return {
				id: "label____" + item.name,
				color: "orange",
				label: item.name,
				edges: [{ to: item.value!, color: "orange", label: "" }].filter(
					t => !!t.to
				),
			};
		} else {
			return infoSelector(item as T);
		}
	});
}
