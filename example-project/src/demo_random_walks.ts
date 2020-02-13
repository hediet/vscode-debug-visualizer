while (true) {
	const data = new Array<number>();
	let value = 0;
	for (let i = 0; i < 10000; i++) {
		const delta = Math.random() > 0.5 ? 1 : -1;
		data.push(value);
		value += delta;
	}

	debugger;
}
