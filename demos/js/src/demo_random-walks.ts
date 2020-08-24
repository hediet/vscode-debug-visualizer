// visualize `data`
const data = new Array<number>();
let curValue = 0;

for (let j = 0; j < 100; j++) {
	addManyRandomValues();
}

function addManyRandomValues() {
	for (let i = 0; i < 100; i++) {
		addRandomValue();
	}
}

function addRandomValue() {
	const delta = Math.random()
		> 0.5 ? 1 : -1;
	data.push(curValue);
	curValue += delta;
}