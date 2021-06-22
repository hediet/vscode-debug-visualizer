import * as React from "react";
import * as ReactDOM from "react-dom";
import "./style.scss";
import { App } from "./components/App";
import * as monaco from "monaco-editor";

(globalThis as any).monaco = monaco;

const elem = document.createElement("div");
elem.className = "react-root";
document.body.append(elem);
ReactDOM.render(<App />, elem);
