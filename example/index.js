
const matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
];

let str = "test1";
for (let i = 0; i < 100000; i++) {
    str += i;
}

function randInt(max) {
    return Math.floor(Math.random() * max);
}

const nodes = [];
for (let i = 0; i < 10; i++) {
    nodes.push(i);
}

const edges = [];
for (let j = 0; j < 15; j++) {
    edges.push([ randInt(nodes.length - 1), randInt(nodes.length - 1) ]);
}

console.log(matrix, str);



