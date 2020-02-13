// See https://codeburst.io/linked-lists-in-javascript-es6-code-part-1-6dd349c3dcc3
/*
After install the Debug Visualizer extension,
press F1, enter "Open Debug Visualizer" and
use the following code as expression to visualize.
Then, press F5 and chose "node".
```
hedietDbgVis.createGraphFromPointers(
	hedietDbgVis.tryEval([
		"list.head",
		"newNode",
		"node",
		"previous",
		this.constructor.name === "LinkedList" ? "this.head" : "err",
	]),
	n => ({
		id: n.data,
		color: "lightblue",
		label: `${n.data}`,
		edges: [{ to: n.next, label: "next" }].filter(i => !!i.to),
	})
);
```

*/

class LinkedList {
	constructor() {
		this.head = null;
	}
}

class Node {
	constructor(data, next = null) {
		(this.data = data), (this.next = next);
	}
}

LinkedList.prototype.insertAtBeginning = function(data) {
	// A newNode object is created with property data
	// and next = null
	let newNode = new Node(data);
	// The pointer next is assigned head pointer
	// so that both pointers now point at the same node.
	newNode.next = this.head;
	// As we are inserting at the beginning the head pointer
	// needs to now point at the newNode.
	this.head = newNode;
	return this.head;
};

LinkedList.prototype.getAt = function(index) {
	let counter = 0;
	let node = this.head;
	while (node) {
		if (counter === index) {
			return node;
		}
		counter++;
		node = node.next;
	}
	return null;
};

// The insertAt() function contains the steps to insert
// a node at a given index.
LinkedList.prototype.insertAt = function(data, index) {
	// if the list is empty i.e. head = null
	if (!this.head) {
		this.head = new Node(data);
		return;
	}
	// if new node needs to be inserted at the front
	// of the list i.e. before the head.
	if (index === 0) {
		this.head = new Node(data, this.head);
		return;
	}
	// else, use getAt() to find the previous node.
	const previous = this.getAt(index - 1);
	let newNode = new Node(data);
	newNode.next = previous.next;
	previous.next = newNode;

	return this.head;
};

const list = new LinkedList();
debugger; // Press F10 to continue
list.insertAtBeginning("4");
list.insertAtBeginning("3");
list.insertAtBeginning("2");
list.insertAtBeginning("1");

list.insertAt("3.5", 3);

console.log("finished");

// Some Plotting.
// Use `data` as expression to visualize.
const data = [];
for (let x = 0; x < 1000; x += 1) {
	data.push(Math.sin(x / 10));

	if (x % 10 === 0) {
		console.log("step");
	}
}
