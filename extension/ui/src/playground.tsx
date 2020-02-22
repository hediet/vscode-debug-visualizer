import * as React from "react";
import * as ReactDOM from "react-dom";
import "./style.scss";
import * as Components from "./playground/index";

const url = new URL(window.location.href);

const theme = url.searchParams.get("theme");
if (theme && theme === "dark") {
	require("./vscode-dark.scss");
} else {
	require("./vscode-light.scss");
}

function render(target: HTMLDivElement) {
	const c = require("./playground/index") as typeof Components;
	ReactDOM.render(<c.Playground />, target);
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
	module.hot.accept("./playground/index", () => {
		render(target);
	});
}
