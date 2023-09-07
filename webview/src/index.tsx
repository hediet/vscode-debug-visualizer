import * as monaco from "monaco-editor";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./components/App";
import "./style.scss";

(globalThis as any).monaco = monaco;

const elem = document.createElement("div");
elem.className = "react-root";
document.body.append(elem);
ReactDOM.render(<App />, elem);
