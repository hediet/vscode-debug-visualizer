import * as React from "react";
import { hotComponent } from "../hotComponent";
import { GUI } from "./GUI";
import { Model } from "../model/Model";

@hotComponent(module)
export class App extends React.Component {
	private readonly model = new Model();

	constructor(props: any) {
		super(props);

		if (this.model.runningMode !== "webview") {
			if (this.model.theme === "light") {
				require("../vscode-light.scss");
			} else {
				require("../vscode-dark.scss");
			}
		}
		console.log(this.model.theme);
	}

	render() {
		return <GUI model={this.model} />;
	}
}
