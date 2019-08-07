import * as React from "react";
import * as ReactDOM from "react-dom";
import "./style.scss";
import { Model } from "./Model/Model";
import Components = require("./Components");

const model = new Model();

function render(target: HTMLDivElement) {
	const c = require("./Components") as typeof Components;
	ReactDOM.render(<c.GUI model={model} />, target);
}

const target = document.createElement("div");
target.className = "target";
document.body.appendChild(target);

render(target);

declare var module: {
	hot?: { accept: (componentName: string, callback: () => void) => void };
};
declare var require: (name: string) => any;

if (module.hot) {
	module.hot.accept("./Components", () => {
		render(target);
	});
}
