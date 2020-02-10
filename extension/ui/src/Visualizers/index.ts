import "./style.scss";
import { ComposedVisualizationProvider } from "./Visualizer";
import { TreeVisualizer } from "./TreeVisualizer/Visualizer";
import { GraphvizGraphVisualizer } from "./GraphVisualizer/GraphvizGraphVisualizer";
import { SvgVisualizer } from "./SvgVisualizer";
import { GraphvizDotVisualizer } from "./GraphVisualizer/GraphvizDotVisualizer";
import { TextVisualizer } from "./TextVisualizer/TextVisualizer";
import { MonacoTextVisualizer } from "./TextVisualizer/MonacoTextVisualizer";
import { AstVisualizer } from "./AstViewer";
import { VisJsGraphVisualizer } from "./GraphVisualizer/VisJsGraphVisualizer";

export const knownVisualizations = new ComposedVisualizationProvider([
	new TreeVisualizer(),
	new GraphvizGraphVisualizer(),
	new VisJsGraphVisualizer(),
	new SvgVisualizer(),
	new GraphvizDotVisualizer(),
	new TextVisualizer(),
	new MonacoTextVisualizer(),
	new AstVisualizer(),
]);
