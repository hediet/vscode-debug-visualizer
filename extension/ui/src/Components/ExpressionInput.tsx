import React = require("react");
import { Model } from "../Model/Model";
import { observer, disposeOnUnmount } from "mobx-react";
import { observable, action, autorun } from "mobx";
import * as monaco from "monaco-editor";

export function getModel(): monaco.editor.ITextModel {
	return monaco.editor.createModel(
		"",
		"javascript",
		monaco.Uri.parse(`file:///main.ts`)
	);
}

@observer
export class ExpressionInput extends React.Component<{ model: Model }> {
	@observable private editor: monaco.editor.IStandaloneCodeEditor | undefined;
	@observable private contentHeight: number | undefined = undefined;
	private model = getModel();

	render() {
		return (
			<div className="component-monaco-editor">
				<div
					style={{ height: this.contentHeight }}
					className="part-editor"
					ref={this.setEditorDiv}
				/>
			</div>
		);
	}

	componentWillUnmount() {
		if (this.editor) {
			this.editor.dispose();
		}
		this.model.dispose();
	}

	@disposeOnUnmount
	private _updateText = autorun(() => {
		const val = this.model.getValue();
		const newVal = this.props.model.expression;
		if (val !== newVal) {
			this.model.setValue(newVal);
		}
	});

	private readonly setEditorDiv = (editorDiv: HTMLDivElement) => {
		if (!editorDiv) {
			return;
		}

		this.editor = monaco.editor.create(editorDiv, {
			model: this.model,
			scrollBeyondLastLine: false,
			minimap: { enabled: false },
			fixedOverflowWidgets: true,
			lineNumbers: "off",
			glyphMargin: false,
			folding: false,
			lineDecorationsWidth: 0,
			lineNumbersMinChars: 0,
			automaticLayout: true,
			scrollbar: {
				horizontal: "hidden",
				vertical: "hidden",
				horizontalScrollbarSize: 0,
				verticalScrollbarSize: 0,
			},
		});

		this.editor.onDidContentSizeChange(e => {
			this.contentHeight = e.contentHeight;
		});

		this.editor.onKeyDown(e => {
			if (e.keyCode == monaco.KeyCode.Enter) {
				if (
					(this.model.getLineCount() <= 1 || e.ctrlKey) &&
					!e.shiftKey
				) {
					e.preventDefault();
					e.stopPropagation();
					this.submit();
				}
			}
		});
	};

	@action.bound
	submit() {
		const val = this.model.getValue();
		console.log(val);
		this.props.model.setExpression(val);
	}
}
