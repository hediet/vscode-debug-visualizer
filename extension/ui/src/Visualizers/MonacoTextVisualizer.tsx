import {
	VisualizationProvider,
	VisualizationCollector,
	asVisualizationId,
} from "./Visualizer";
import {
	ExtractedData,
	isCommonDataType,
} from "@hediet/debug-visualizer-data-extraction";
import * as monaco from "monaco-editor";
import React = require("react");
import { observer, disposeOnUnmount } from "mobx-react";
import { autorun, observable } from "mobx";

@observer
export class MonacoEditor extends React.Component<{ text: string }> {
	@observable private editor: monaco.editor.IStandaloneCodeEditor | undefined;

	componentWillUnmount() {
		if (this.editor) {
			this.editor.dispose();
		}
	}

	@disposeOnUnmount
	private _updateText = autorun(() => {
		if (this.editor) {
			this.editor.setValue(this.props.text);
		}
	});

	private readonly setEditorDiv = (editorDiv: HTMLDivElement) => {
		if (!editorDiv) {
			return;
		}

		this.editor = monaco.editor.create(editorDiv, {
			value: this.props.text,
			automaticLayout: true,
			scrollBeyondLastLine: false,
			minimap: { enabled: false },
			fixedOverflowWidgets: true,
			readOnly: true,
		});
	};

	render() {
		return (
			<div className="component-monaco-editor">
				<div className="part-editor" ref={this.setEditorDiv} />
			</div>
		);
	}
}

export class MonacoTextVisualizer extends VisualizationProvider {
	getVisualizations(
		data: ExtractedData,
		collector: VisualizationCollector
	): void {
		if (isCommonDataType(data, { text: true })) {
			collector.addVisualization({
				id: asVisualizationId("monaco-text"),
				name: "Monaco Editor",
				priority: 95,
				render() {
					return <MonacoEditor text={data.text} />;
				},
			});
		}
	}
}
