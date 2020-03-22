import { ComposedVisualizer, Visualizer } from "../Visualizer";
import { EnabledVisualizers } from "../EnabledVisualizers";

declare const ENABLED_VISUALIZERS: EnabledVisualizers;

function isVisualizer(v: Visualizer | false): v is Visualizer {
	return !!v;
}

export const knownVisualizations = new ComposedVisualizer(
	[
		ENABLED_VISUALIZERS.VisJsGraphVisualizer &&
			new (require("./graph-visualizers/VisJsGraphVisualizer") as typeof import("./graph-visualizers/VisJsGraphVisualizer")).VisJsGraphVisualizer(),
		ENABLED_VISUALIZERS.TreeVisualizer &&
			new (require("./TreeVisualizer/TreeVisualizer") as typeof import("./TreeVisualizer/TreeVisualizer")).TreeVisualizer(),
		ENABLED_VISUALIZERS.GraphvizGraphVisualizer &&
			new (require("./graph-visualizers/GraphvizGraphVisualizer") as typeof import("./graph-visualizers/GraphvizGraphVisualizer")).GraphvizGraphVisualizer(),
		ENABLED_VISUALIZERS.SvgVisualizer &&
			new (require("./SvgVisualizer") as typeof import("./SvgVisualizer")).SvgVisualizer(),
		ENABLED_VISUALIZERS.GraphvizDotVisualizer &&
			new (require("./graph-visualizers/GraphvizDotVisualizer") as typeof import("./graph-visualizers/GraphvizDotVisualizer")).GraphvizDotVisualizer(),
		ENABLED_VISUALIZERS.TextVisualizer &&
			new (require("./text-visualizers/TextVisualizer") as typeof import("./text-visualizers/TextVisualizer")).TextVisualizer(),
		ENABLED_VISUALIZERS.PlotlyVisualizer &&
			new (require("./plotly") as typeof import("./plotly")).PlotlyVisualizer(),
		ENABLED_VISUALIZERS.GridVisualizer &&
			new (require("./GridVisualizer") as typeof import("./GridVisualizer")).GridVisualizer(),
		ENABLED_VISUALIZERS.MonacoTextVisualizer &&
			new (require("./text-visualizers/MonacoTextVisualizer") as typeof import("./text-visualizers/MonacoTextVisualizer")).MonacoTextVisualizer(),
		ENABLED_VISUALIZERS.AstVisualizer &&
			new (require("./AstVisualizer") as typeof import("./AstVisualizer")).AstVisualizer(),
	].filter(isVisualizer)
);
