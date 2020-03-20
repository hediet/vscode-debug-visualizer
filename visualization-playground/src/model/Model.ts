import { observable, action, computed, when } from "mobx";
import {
	Visualization,
	VisualizationId,
	knownVisualizations,
} from "@hediet/visualization";
import { Disposable } from "@hediet/std/disposable";

export class Model {
	public readonly dispose = Disposable.fn();

	@observable
	public theme: "dark" | "light" = "light";

	@observable private preferredVisualizationId:
		| VisualizationId
		| undefined = undefined;

	@action
	public setPreferredVisualizationId(id: VisualizationId) {
		this.preferredVisualizationId = id;
	}

	@computed get visualizations():
		| {
				visualization: Visualization | undefined;
				allVisualizations: Visualization[];
		  }
		| undefined {
		return undefined;
		/*if (this.state.kind === "data") {
			const vis = knownVisualizations.getBestVisualization(
				this.state.result.data,
				this.preferredVisualizationId
			);
			return vis;
		} else {
			return undefined;
		}*/
	}

	constructor() {
		const url = new URL(window.location.href);

		const theme = url.searchParams.get("theme");
		if (theme && theme === "dark") {
			this.theme = "dark";
		} else {
			this.theme = "light";
		}
	}
}
