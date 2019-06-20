import * as React from "react";
import * as ReactDOM from "react-dom";

import "./style.scss";
import App = require("./App");
import { Model } from "./Model";

const model = new Model();

function render(target: HTMLDivElement, app: typeof App) {
    ReactDOM.render(<app.GUI model={model} />, target);
}

const target = document.createElement("div");
target.className = "root";
render(target, App);
document.body.appendChild(target);

declare var module: { hot?: { accept: (componentName: string, callback: () => void) => void } };
declare var require: (name: string) => any;

if (module.hot) {
    module.hot.accept("./App", () => {
        console.log("render");
        render(target, require("./App"));
    });
}
