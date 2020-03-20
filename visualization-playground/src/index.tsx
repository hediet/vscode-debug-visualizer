import * as React from "react";
import * as ReactDOM from "react-dom";
import "./style.scss";
import { Model } from "./model/Model";
import Components = require("./components/GUI");

const model = new Model();

if (model.theme === "light") {
	require("./vscode-light.scss");
} else {
	require("./vscode-dark.scss");
}

function render(target: HTMLDivElement) {
	const c = require("./components/GUI") as typeof Components;
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
	module.hot.accept("./components/GUI", () => {
		render(target);
	});
}
