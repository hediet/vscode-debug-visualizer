# @hediet/debug-visualizer-data-extraction

[![](https://img.shields.io/twitter/follow/hediet_dev.svg?style=social)](https://twitter.com/intent/follow?screen_name=hediet_dev)

A library that helps implementing data extractors for the Debug Visualizer VS Code extension.
It will automatically be injected by the extension when the debugger attaches.
Compatible with NodeJS and browsers.

# Installation

Use the following command to install the library using yarn:

```
yarn add @hediet/debug-visualizer-data-extraction
```

# Usage

## `createGraphFromPointers` Helper

```ts
import { createGraphFromPointers } from "@hediet/debug-visualizer-data-extraction";

setTimeout(() => {
	new Main().run();
}, 0);

class Main {
	run() {
		const list = new DoublyLinkedList("1");
		list.setNext(new DoublyLinkedList("2"));
		list.next!.setNext(new DoublyLinkedList("3"));
		list.next!.next!.setNext(new DoublyLinkedList("4"));

		// Watch `visualize()` with the Debug Visualizer Extension for VS Code!
		const visualize = () =>
			// Returns `CommonDataTypes.Graph` data which can be visualized by
			// either the vis.js or the graphviz visualizer.
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
```

![](../docs/doubly-linked-list-reverse-demo.gif)

## Registering Custom Data Extractors

```ts
import { getDataExtractorApi } from "@hediet/debug-visualizer-data-extraction";

getDataExtractorApi().registerExtractor({
	id: "my-foo-extractor",
	getExtractions: (data, collector) => {
		if (data instanceof Foo) {
			collector.addExtraction({
				id: "my-foo-extraction",
				name: "My Foo Extraction",
				priority: 2000,
				extractData: () => ({ kind: { text: true }, text: "Foo" }),
			});
		}
	},
});

setTimeout(() => {
	new Main().run();
}, 0);

class Foo {}

class Main {
	run() {
		const f = new Foo();
		// if `f` is watched by the Debug Visualizer,
		// `my-foo-extractor` will provide the data for the visualizers.
		// See `CommonDataTypes` for data types that have built in visualizers.
		debugger;
	}
}
```
