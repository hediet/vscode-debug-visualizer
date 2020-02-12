import {
	CommonDataTypes,
	EdgeGraphData,
	NodeGraphData,
} from "../CommonDataTypes";

/**
 * Given a list of roots, it creates a graph by following their edges recursively.
 * Tracks cycles.
 */
export function createGraph<T>(
	roots: T[],
	infoSelector: (
		item: T
	) => {
		id?: string | number;
		edges: ({ to: T } & Omit<EdgeGraphData, "from" | "to">)[];
	} & Omit<NodeGraphData, "id">
): CommonDataTypes.Graph {
	const r: CommonDataTypes.Graph = {
		kind: {
			graph: true,
		},
		nodes: [],
		edges: [],
	};
	let idCounter = 1;
	const ids = new Map<T, string>();
	function getId(item: T): string {
		const _id = infoSelector(item).id;
		if (_id !== undefined) {
			return "" + _id;
		}

		let id = ids.get(item);
		if (!id) {
			id = `hediet.de/id-${idCounter++}`;
			ids.set(item, id);
		}
		return id;
	}

	const queue = new Array<T>(...roots);
	const processed = new Set<T>();

	while (queue.length > 0) {
		const item = queue.shift()!;
		if (processed.has(item)) {
			continue;
		}
		processed.add(item);
		const nodeInfo = infoSelector(item);
		const fromId = getId(item);
		r.nodes.push({ ...nodeInfo, id: fromId, ["edges" as any]: undefined });
		for (const e of nodeInfo.edges) {
			const toId = getId(e.to);
			r.edges.push({
				...e,
				from: fromId,
				to: toId,
			});
			if (!processed.has(e.to)) {
				queue.push(e.to);
			}
		}
	}
	return r;
}

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
