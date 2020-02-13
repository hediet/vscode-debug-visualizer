import {
	CommonDataTypes,
	EdgeGraphData,
	NodeGraphData,
} from "../../CommonDataTypes";

export type CreateGraphEdge<T> = { to: T } & Omit<EdgeGraphData, "from" | "to">;

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
		edges: CreateGraphEdge<T>[];
	} & Omit<NodeGraphData, "id">,
	options: { maxSize?: number } = {}
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

	const queue = new Array<{ item: T; dist: number }>(
		...roots.map(r => ({ item: r, dist: 0 }))
	);
	const processed = new Set<T>();

	while (queue.length > 0) {
		const { item, dist } = queue.shift()!;
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
			let shouldPush = !processed.has(e.to);
			if (
				options.maxSize &&
				processed.size + queue.length > options.maxSize
			) {
				shouldPush = false;
			}
			if (shouldPush) {
				queue.push({ item: e.to, dist: dist + 1 });
			}
		}
	}
	return r;
}
