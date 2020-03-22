import { observable, action, computed, when } from "mobx";
import {
	Visualization,
	VisualizationId,
	knownVisualizations,
} from "@hediet/visualization";
import { Disposable } from "@hediet/std/disposable";
import { ExpressionModel } from "../components/LightExpressionInput";
import { ExtractedData } from "@hediet/debug-visualizer-data-extraction";
import { QueryController } from "./QueryController";

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

	public jsonExpression = new ExpressionModel(
		JSON.stringify(
			{
				kind: { graph: true },
				nodes: [
					{ id: "1", label: "1" },
					{ id: "2", label: "2" },
				],
				edges: [
					{
						from: "1",
						to: "2",
					},
				],
			},
			undefined,
			4
		)
	);

	get state():
		| { kind: "data"; data: ExtractedData }
		| { kind: "parseError" } {
		const json = this.jsonExpression.value;
		let data: ExtractedData;
		try {
			data = JSON.parse(json);
		} catch (e) {
			return {
				kind: "parseError",
			};
		}

		return {
			kind: "data",
			data,
		};
	}

	@computed get visualizations():
		| {
				visualization: Visualization | undefined;
				allVisualizations: Visualization[];
		  }
		| undefined {
		if (this.state.kind === "data") {
			const vis = knownVisualizations.getBestVisualization(
				this.state.data,
				this.preferredVisualizationId
			);
			return vis;
		} else {
			return undefined;
		}
	}

	private readonly q = new QueryController(this);

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
