import * as ts from "typescript";
import {
	enableHotReload,
	registerUpdateReconciler,
	getReloadCount,
	hotClass,
} from "@hediet/node-reload";
enableHotReload();

import {
	registerAll,
	CommonDataTypes,
} from "@hediet/debug-visualizer-data-extraction";
import { MockLanguageServiceHost } from "./MockLanguageServiceHost";

registerAll();

registerUpdateReconciler(module);

function getClosure<T>(
	root: T,
	edgeSelector: (item: T) => { item: T; edgeLabel: string }[],
	labelSelector: (item: T) => string
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
		let id = ids.get(item);
		if (!id) {
			id = (idCounter++).toString();
			ids.set(item, id);
		}
		return id;
	}

	const queue = new Array<T>(root);
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

let id = 0;
class DoubleLinkedList {
	public readonly id = (id++).toString();
	constructor(public name: string) {}

	next: DoubleLinkedList | undefined;
	prev: DoubleLinkedList | undefined;

	public setNext(val: DoubleLinkedList): void {
		val.prev = this;
		this.next = val;
	}

	toData(): CommonDataTypes.GraphData {
		return getClosure<DoubleLinkedList>(
			this,
			r =>
				[
					{ item: r.next!, edgeLabel: "next" },
					{ item: r.prev!, edgeLabel: "prev" },
				].filter(r => !!r.item),
			item => item.name
		);
	}
}

@hotClass(module)
class Main {
	run() {
		const mainFile = {
			name: "main.ts",
			content: `
class Test1 {
	public foo(a: number) {
	}
}
		`,
		};
		const files = new Map<string, string>([
			[mainFile.name, mainFile.content],
		]);
		const serviceHost = new MockLanguageServiceHost(files, {});
		const baseService = ts.createLanguageService(
			serviceHost,
			ts.createDocumentRegistry()
		);
		const prog = baseService.getProgram()!;

		const identifiers = new Array<ts.Identifier>();
		function traverse(node: ts.Node) {
			if (ts.isIdentifier(node)) identifiers.push(node);
			node.forEachChild(traverse);
		}
		traverse(prog.getSourceFiles()[0]);

		const c = prog.getTypeChecker();
		let myValue = undefined;
		const sf = prog.getSourceFiles()[0];
		myValue = sf.getText();
		myValue = {
			sf,
			fn: (n: ts.Node) => {
				try {
					const t = c.getTypeAtLocation(n);
					return t ? c.typeToString(t) : undefined;
				} catch (e) {
					return "" + e;
				}
			},
		};
		myValue = {
			sf,
			fn: (n: ts.Node) => {
				try {
					const t = c.getSymbolAtLocation(n);
					return t ? ts.SymbolFlags[t.flags] : undefined;
				} catch (e) {
					return "" + e;
				}
			},
		};

		debugger;
		for (const ident of identifiers) {
			const s = c.getSymbolAtLocation(ident);
			myValue = ident;
		}

		const first = (myValue = new DoubleLinkedList("1"));
		myValue.setNext(new DoubleLinkedList("2"));
		myValue.next!.setNext(new DoubleLinkedList("3"));
		myValue.next!.next!.setNext(new DoubleLinkedList("4"));

		let last: DoubleLinkedList | undefined = undefined;
		while (myValue) {
			myValue.prev = myValue.next;
			myValue.next = last;
			last = myValue;
			myValue = myValue.prev;
		}
		myValue = first;

		myValue = {
			kind: { text: true, svg: true },
			text: `
				<svg height="210" width="500">
					<polygon
						points="100,10 40,198 190,78 10,78 160,198"
						style="fill:lime;stroke:purple;stroke-width:5;fill-rule:nonzero;"
					/>
				</svg>
	  		`,
		};
	}
}

if (getReloadCount(module) === 0) {
	new Main().run();
}
