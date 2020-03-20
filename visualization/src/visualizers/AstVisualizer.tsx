import {
	Visualizer,
	VisualizationCollector,
	asVisualizationId,
} from "../Visualizer";
import {
	ExtractedData,
	isCommonDataType,
	CommonDataTypes,
} from "@hediet/debug-visualizer-data-extraction";
import { createTreeViewModelFromTreeNodeData } from "./TreeVisualizer/TreeVisualizer";
import { TreeWithPathView, TreeViewModel } from "./TreeVisualizer/Views";
import * as React from "react";
import { observer, disposeOnUnmount } from "mobx-react";
import { observable, autorun, trace } from "mobx";
import * as monaco from "monaco-editor";
import { getLanguageId } from "./text-visualizers/MonacoTextVisualizer";
import * as LineColumn from "line-column";

export class AstVisualizer extends Visualizer {
	visualize(data: ExtractedData, collector: VisualizationCollector): void {
		if (isCommonDataType(data, { ast: true })) {
			collector.addVisualization({
				id: asVisualizationId("ast"),
				name: "AST",
				priority: 110,
				render() {
					const m = createTreeViewModelFromTreeNodeData(data.root);
					const l = LineColumn(data.text);
					function translatePosition(pos: number): monaco.IPosition {
						const r = l.fromIndex(pos);
						return {
							column: r.col,
							lineNumber: r.line,
						};
					}
					const nodeInfoToRange = (info: NodeInfo): monaco.IRange => {
						const start = translatePosition(info.position);
						const end = translatePosition(
							info.position + info.length
						);
						const range = monaco.Range.fromPositions(start, end);
						return range;
					};
					return (
						<AstTree
							model={m}
							data={data}
							nodeInfoToRange={nodeInfoToRange}
						/>
					);
				},
			});
		}
	}
}

interface NodeInfo {
	position: number;
	length: number;
}

@observer
export class AstTree extends React.Component<{
	model: TreeViewModel<NodeInfo>;
	data: CommonDataTypes.Ast;
	nodeInfoToRange: (info: NodeInfo) => monaco.IRange;
}> {
	render() {
		const model = this.props.model;
		const data = this.props.data;
		let languageId = "text";
		if (data.fileName) {
			languageId = getLanguageId(data.fileName);
		}
		return (
			<div className="component-AstTree">
				<div className="part-tree2">
					<TreeWithPathView model={model} />
				</div>
				<div className="part-editor">
					<MonacoEditor
						nodeInfoToRange={this.props.nodeInfoToRange}
						model={model}
						languageId={languageId}
						text={data.text}
					/>
				</div>
			</div>
		);
	}
}

@observer
export class MonacoEditor extends React.Component<{
	text: string;
	languageId: string;
	model: TreeViewModel<NodeInfo>;
	nodeInfoToRange: (info: NodeInfo) => monaco.IRange;
}> {
	@observable private editor: monaco.editor.IStandaloneCodeEditor | undefined;

	private modelNotObservable:
		| monaco.editor.ITextModel
		| undefined = undefined;

	@observable private model: monaco.editor.ITextModel | undefined = undefined;

	private markedDecorations: string[] = [];
	private selectedDecorations: string[] = [];

	componentWillUnmount() {
		if (this.editor) {
			this.editor.dispose();
		}
	}

	@disposeOnUnmount
	private _updateMarkedDecorations = autorun(
		() => {
			if (this.editor && this.model) {
				const editorModel = this.model;
				const ranges = this.props.model.marked.map(s =>
					this.props.nodeInfoToRange(s.data)
				);
				this.markedDecorations = this.editor.deltaDecorations(
					this.markedDecorations,
					ranges.map(range => ({
						range,
						options: { className: "marked" },
					}))
				);
				if (ranges.length > 0) {
					this.editor.revealRange(
						ranges[0],
						monaco.editor.ScrollType.Smooth
					);
				}
			}
		},
		{ name: "updateMarkedDecorations" }
	);

	@disposeOnUnmount
	private _updateSelectedDecoration = autorun(
		() => {
			if (this.editor && this.model) {
				const selected = this.props.model.selected;
				if (selected) {
					const range = this.props.nodeInfoToRange(selected.data);
					this.selectedDecorations = this.editor.deltaDecorations(
						this.selectedDecorations,
						[
							{
								range,
								options: { className: "selected" },
							},
						]
					);
					this.editor.revealRange(
						range,
						monaco.editor.ScrollType.Smooth
					);
				} else {
					this.selectedDecorations = this.editor.deltaDecorations(
						this.selectedDecorations,
						[]
					);
				}
			}
		},
		{ name: "updateDecorations" }
	);

	@disposeOnUnmount
	private _updateText = autorun(() => {
		if (this.editor) {
			const model = monaco.editor.createModel(
				this.props.text,
				this.props.languageId,
				undefined
			);

			this.editor.setModel(model);

			if (this.modelNotObservable) {
				this.modelNotObservable.dispose();
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
			lineDecorationsWidth: 0,
			lineNumbersMinChars: 4,
			glyphMargin: false,
			smoothScrolling: true,
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
