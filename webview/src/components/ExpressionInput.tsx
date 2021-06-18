import * as React from "react";
import { Model } from "../model/Model";
import { observer, disposeOnUnmount } from "mobx-react";
import { observable, action, autorun } from "mobx";
import * as monaco from "monaco-editor";

@observer
export class ExpressionInput extends React.Component<{ model: Model }> {
	@observable private editor: monaco.editor.IStandaloneCodeEditor | undefined;
	@observable private contentHeight: number | undefined = undefined;
	private model = monaco.editor.createModel(
		"",
		"javascript",
		monaco.Uri.parse(`file:///main.ts`)
	);

	render() {
		return (
			<div
				className="component-monaco-editor"
				style={{
					// The monaco editor does not have a padding, so we add our own.
					// We have to match the colors of monaco's background.
					backgroundColor:
						this.props.model.theme === "light"
							? "white"
							: "#263238",
				}}
			>
				<div
					className="part-editor"
					style={{
						height: this.contentHeight,
					}}
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

	@disposeOnUnmount
	private _updateLanguageId = autorun(() => {
		monaco.editor.setModelLanguage(this.model, this.props.model.languageId);
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

		this.editor.onDidBlurEditorText(() => {
			this.submit();
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
		//console.log(val);
		this.props.model.setExpression(val);
	}
}
