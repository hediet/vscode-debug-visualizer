import {
	GraphEdge,
	GraphNode,
	GraphVisualizationData,
} from "../../CommonDataTypes";

export type CreateGraphEdge<T> = ({ to: T } | { from: T } | { include: T }) &
	Omit<GraphEdge, "from" | "to">;

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
	} & Omit<GraphNode, "id">,
	options: { maxSize?: number } = {}
): GraphVisualizationData {
	const r: GraphVisualizationData = {
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
			let other: T;
			let toId: string | undefined;
			let fromId_: string | undefined;
			if ("to" in e) {
				other = e.to;
				toId = getId(e.to);
				fromId_ = fromId;
			} else if ("from" in e) {
				other = e.from;
				toId = getId(e.from);
				fromId_ = fromId;
			} else if ("include" in e) {
				other = e.include;
			} else {
				throw new Error("Every edge must either have 'to' or 'from'");
			}

			if (fromId_ !== undefined && toId !== undefined) {
				r.edges.push({
					...e,
					from: fromId_,
					to: toId,
				});
			}
			let shouldPush = !processed.has(other);
			if (
				options.maxSize &&
				processed.size + queue.length > options.maxSize
			) {
				shouldPush = false;
			}
			if (shouldPush) {
				queue.push({ item: other, dist: dist + 1 });
			}
		}
	}
	return r;
}
