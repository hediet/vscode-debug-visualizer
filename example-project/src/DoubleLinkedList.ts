import {
	enableHotReload,
	registerUpdateReconciler,
	getReloadCount,
	hotClass,
} from "@hediet/node-reload";
enableHotReload();
registerUpdateReconciler(module);

import {
	registerAll,
	CommonDataTypes,
	getClosureObj,
} from "@hediet/debug-visualizer-data-extraction";

registerAll();

setTimeout(() => {
	new Main().run();
}, 0);

@hotClass(module)
class Main {
	run() {
		let myValue: DoubleLinkedList | undefined = new DoubleLinkedList("1");

		const first = myValue;
		myValue.setNext(new DoubleLinkedList("2"));
		myValue.next!.setNext(new DoubleLinkedList("3"));
		myValue.next!.next!.setNext(new DoubleLinkedList("4"));

		const dbgLast = myValue.next!.next!.next!;

		let last: DoubleLinkedList | undefined = undefined;
		while (myValue) {
			myValue.prev = myValue.next;
			myValue.next = last;
			last = myValue;
			myValue = myValue.prev;
		}
		myValue = first;
	}

	getDebugVisualization(
		items: Record<string, DoubleLinkedList | undefined>
	): CommonDataTypes.GraphData {
		return getClosureObj(
			items,
			r =>
				[
					{ item: r.next!, edgeLabel: "next" },
					{ item: r.prev!, edgeLabel: "prev" },
				].filter(r => !!r.item),
			item => item.name,
			item => item.id
		);
	}
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
}
