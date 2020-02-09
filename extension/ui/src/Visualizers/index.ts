import "./style.scss";
import { ComposedVisualizationProvider } from "./Visualizer";
import { TreeVisualizer } from "./TreeVisualizer/Visualizer";
import { DotGraphVisualizer } from "./DotGraphVisualizer";
import { SvgVisualizer } from "./SvgVisualizer";
import { DotVisualizer } from "./DotVisualizer";
import { TextVisualizer } from "./TextVisualizer";
import { MonacoTextVisualizer } from "./MonacoTextVisualizer";
import { AstVisualizer } from "./AstViewer";
import { VisJsGraphVisualizer } from "./VisJsGraphVisualizer";

export const knownVisualizations = new ComposedVisualizationProvider([
	new TreeVisualizer(),
	new DotGraphVisualizer(),
	new VisJsGraphVisualizer(),
	new SvgVisualizer(),
	new DotVisualizer(),
	new TextVisualizer(),
	new MonacoTextVisualizer(),
	new AstVisualizer(),
]);
