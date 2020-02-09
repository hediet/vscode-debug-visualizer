import { CommonDataTypes } from "../CommonDataTypes";

export function getClosureObj<T>(
	roots: Record<string, T | undefined | null>,
	edgeSelector: (item: T) => { item: T; edgeLabel: string }[],
	labelSelector: (item: T) => string,
	idSelector?: (item: T) => string | number
): CommonDataTypes.GraphData {
	const items = Object.entries(roots).map(([k, v]) => v);
	return getClosure<T>(
		items.filter(i => !!i) as T[],
		edgeSelector,
		item => {
			const names = new Array<string>();
			for (const [key, val] of Object.entries(roots)) {
				if (val === item) {
					names.push(key);
				}
			}
			const base = labelSelector(item);
			return names.length === 0 ? base : `${names.join(", ")}: ${base}`;
		},
		idSelector
	);
}

export function getClosure<T>(
	roots: T[],
	edgeSelector: (item: T) => { item: T; edgeLabel: string }[],
	labelSelector: (item: T) => string,
	idSelector?: (item: T) => string | number
): CommonDataTypes.GraphData {
	const r: CommonDataTypes.GraphData = {
		kind: {
			graph: true,
		},
		nodes: [],
		edges: [],
	};
	let idCounter = 1;
	const ids = new Map<T, string>();
	function getId(item: T): string {
		if (idSelector) {
			return "" + idSelector(item);
		}

		let id = ids.get(item);
		if (!id) {
			id = (idCounter++).toString();
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
		const edges = edgeSelector(item);
		const fromId = getId(item);
		r.nodes.push({ id: fromId, label: labelSelector(item) });
		for (const e of edges) {
			const toId = getId(e.item);
			r.edges.push({
				from: fromId,
				to: toId,
				label: e.edgeLabel,
			});
			if (!processed.has(e.item)) {
				queue.push(e.item);
			}
		}
	}
	return r;
}
