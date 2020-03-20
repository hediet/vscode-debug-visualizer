// import "./style.scss";
import { ComposedVisualizer } from "../Visualizer";
import { TreeVisualizer } from "./TreeVisualizer/TreeVisualizer";
import { GraphvizGraphVisualizer } from "./graph-visualizers/GraphvizGraphVisualizer";
import { SvgVisualizer } from "./SvgVisualizer";
import { GraphvizDotVisualizer } from "./graph-visualizers/GraphvizDotVisualizer";
import { TextVisualizer } from "./text-visualizers/TextVisualizer";
import { MonacoTextVisualizer } from "./text-visualizers/MonacoTextVisualizer";
import { AstVisualizer } from "./AstVisualizer";
import { VisJsGraphVisualizer } from "./graph-visualizers/VisJsGraphVisualizer";
import { PlotlyVisualizer } from "./plotly";
import { GridVisualizer } from "./GridVisualizer";

export const knownVisualizations = new ComposedVisualizer([
	new TreeVisualizer(),
	new GraphvizGraphVisualizer(),
	new VisJsGraphVisualizer(),
	new SvgVisualizer(),
	new GraphvizDotVisualizer(),
	new TextVisualizer(),
	new MonacoTextVisualizer(),
	new AstVisualizer(),
	new PlotlyVisualizer(),
	new GridVisualizer(),
]);
