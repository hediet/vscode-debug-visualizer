import {
	getDataExtractorApi,
	createGraphFromPointers,
} from "@hediet/debug-visualizer-data-extraction";

getDataExtractorApi().registerDefaultExtractors();

setTimeout(() => {
	new Main().run();
}, 0);

class Main {
	run() {
		const list = new DoublyLinkedList("1");
		list.setNext(new DoublyLinkedList("2"));
		list.next!.setNext(new DoublyLinkedList("3"));
		list.next!.next!.setNext(new DoublyLinkedList("4"));

		const visualize = () =>
			createGraphFromPointers({ list, last, cur }, i => ({
				id: i.id,
				label: i.name,
				color: finished.has(i) ? "lime" : undefined,
				edges: [
					{ to: i.next!, label: "next" },
					{ to: i.prev!, label: "prev", color: "lightgray" },
				].filter(r => !!r.to),
			}));

		const finished = new Set();
		var cur: DoublyLinkedList | undefined = list;
		// Reverses `list`. Finished nodes have correct pointers,
		// their next node is also finished.
		var last: DoublyLinkedList | undefined = undefined;
		while (cur) {
			cur.prev = cur.next;
			cur.next = last;
			finished.add(cur);
			last = cur;
			cur = cur.prev;
		}
		console.log("finished");
	}
}

let id = 0;
class DoublyLinkedList {
	public readonly id = (id++).toString();
	constructor(public name: string) {}

	next: DoublyLinkedList | undefined;
	prev: DoublyLinkedList | undefined;

	public setNext(val: DoublyLinkedList): void {
		val.prev = this;
		this.next = val;
	}
}
