import {
	Visualizer,
	VisualizationCollector,
	asVisualizationId,
} from "../../Visualizer";
import {
	ExtractedData,
	isCommonDataType,
} from "@hediet/debug-visualizer-data-extraction";
import * as monaco from "monaco-editor";
import * as React from "react";
import { observer, disposeOnUnmount } from "mobx-react";
import { autorun, observable } from "mobx";

export class MonacoTextVisualizer extends Visualizer {
	visualize(data: ExtractedData, collector: VisualizationCollector): void {
		if (isCommonDataType(data, { text: true })) {
			collector.addVisualization({
				id: asVisualizationId("monaco-text"),
				name: "Monaco Editor",
				priority: 95,
				render() {
					let id = "text";
					if (data.fileName) {
						id = getLanguageId(data.fileName);
					}

					return <MonacoEditor text={data.text} languageId={id} />;
				},
			});
		}
	}
}

export function getLanguageId(fileName: string): string {
	const l = monaco.languages.getLanguages();
	const result = l.find(l => {
		if (l.filenamePatterns) {
			for (const p of l.filenamePatterns) {
				if (new RegExp(p).test(fileName)) {
					return true;
				}
			}
		}
		if (l.extensions) {
			for (const p of l.extensions) {
				if (fileName.endsWith(p)) {
					return true;
				}
			}
		}

		return false;
	});

	if (result) {
		return result.id;
	}
	return "text";
}

@observer
export class MonacoEditor extends React.Component<{
	text: string;
	languageId: string;
}> {
	@observable private editor: monaco.editor.IStandaloneCodeEditor | undefined;

	componentWillUnmount() {
		if (this.editor) {
			this.editor.dispose();
		}
	}

	private model: monaco.editor.ITextModel | undefined = undefined;

	@disposeOnUnmount
	private _updateText = autorun(() => {
		if (this.editor) {
			const model = monaco.editor.createModel(
				this.props.text,
				this.props.languageId,
				undefined
			);

			this.editor.setModel(model);

			/*			this.editor!.updateOptions({ readOnly: false });

			setTimeout(() => {
				const a = this.editor!.getAction(
					"editor.action.formatDocument"
				);
				a.run().then(() => {
					this.editor!.updateOptions({ readOnly: true });
				});
			}, 200);*/

			if (this.model) {
				this.model.dispose();
			}
			this.model = model;
		}
	});

	private readonly setEditorDiv = (editorDiv: HTMLDivElement) => {
		if (!editorDiv) {
			return;
		}

		this.editor = monaco.editor.create(editorDiv, {
			model: null,
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
