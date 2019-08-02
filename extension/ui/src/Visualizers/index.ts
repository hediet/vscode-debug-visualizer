import "./style.scss";
import { ComposedVisualizationProvider } from "./Visualizer";
import { TreeVisualizer } from "./TreeVisualizer/Visualizer";
import { DotGraphVisualizer } from "./DotGraphVisualizer";
import { SvgVisualizer } from "./SvgVisualizer";
import { DotVisualizer } from "./DotVisualizer";
import { TextVisualizer } from "./TextVisualizer";
import { MonacoTextVisualizer } from "./MonacoTextVisualizer";

export const knownVisualizations = new ComposedVisualizationProvider([
	new TreeVisualizer(),
	new DotGraphVisualizer(),
	new SvgVisualizer(),
	new DotVisualizer(),
	new TextVisualizer(),
	new MonacoTextVisualizer(),
]);
