// visualize `data`
const data = new Array<number>();
let value = 0;
for (let i = 0; i < 100000; i++) {
	const delta = Math.random() > 0.5 ? 1 : -1;
	data.push(value);
	value += delta;

	if (i % 1000 === 0) {
		debugger;
	}
}
