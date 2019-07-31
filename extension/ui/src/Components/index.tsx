import React = require("react");
import { Model } from "../Model";
import { observer } from "mobx-react";
import { observable, action, computed } from "mobx";
import { Popover, Icon, Button } from "@blueprintjs/core";
import classnames = require("classnames");
import Measure from "react-measure";
import { DotGraphViewer } from "./GraphViz";
import { TreeView } from "../Visualizers/TreeVisualizer/Views";
import { createTreeViewModelFromTreeNodeData } from "../Visualizers/TreeVisualizer/Visualizers";
import { CommonDataTypes } from "@hediet/debug-visualizer-data-extraction";
@observer
export class GUI extends React.Component<{ model: Model }> {
	@observable text: string = "node";

	@observable expanded = false;

	render() {
		const m = this.props.model;
		return (
			<div className="component-GUI" tabIndex={0}>
				<div className="part-header">
					<ExpandButton
						expanded={this.expanded}
						setExpanded={v => (this.expanded = v)}
					/>
					<div className="part-header-content">
						<div className="part-header-main">
							<ExpressionInput model={m} />
							<Button
								minimal
								small
								className="part-icon"
								icon="refresh"
								onClick={() => m.refresh()}
							/>
							<Button
								minimal
								small
								className="part-icon"
								icon="log-in"
								onClick={() => m.openBrowser()}
							/>
							<Button
								minimal
								small
								className="part-icon"
								icon="locate"
								onClick={() => m.useSelectionAsExpression()}
							/>
						</div>
						{this.expanded && (
							<>
								<div style={{ height: 6 }} />
								<div className="part-header-options">
									<NamedSelect
										name="Source"
										selected={0}
										options={[{ label: "js" }]}
									/>
									<div style={{ width: 10 }} />

									<NamedSelect
										name="Extractor"
										selected={0}
										options={[{ label: "literal" }]}
									/>
									<div style={{ width: 10 }} />

									<NamedSelect
										name="Visualizer"
										selected={0}
										options={[{ label: "literal" }]}
									/>
								</div>
							</>
						)}
					</div>
				</div>
				<div className="part-visualizer">
					<Visualizer model={m} />
				</div>
			</div>
		);
	}

	renderValue(value: string) {
		return <div>{`${value.length}`}</div>;
	}
}

@observer
export class ExpressionInput extends React.Component<{ model: Model }> {
	@observable editedExpression: string | undefined;
	@computed get currentExpression(): string {
		return this.editedExpression !== undefined
			? this.editedExpression
			: this.props.model.expression;
	}

	@action.bound
	updateCurrentExpression(newValue: string) {
		this.editedExpression = newValue;
	}

	@action.bound
	submit() {
		if (!this.editedExpression) {
			return;
		}
		this.props.model.setExpression(this.editedExpression);
		this.editedExpression = undefined;
	}

	render() {
		return (
			<input
				className="part-expression-input"
				value={this.currentExpression}
				onChange={e => this.updateCurrentExpression(e.target.value)}
				onBlur={this.submit}
				onKeyPress={e => {
					if (e.charCode === 13) {
						// enter
						this.submit();
					}
				}}
			/>
		);
	}
}

@observer
export class Visualizer extends React.Component<{ model: Model }> {
	render() {
		return (
			<div className="component-Visualizer">{this.renderContent()}</div>
		);
		/*
		

		<DotGraphViewer
					data={{
						kind: "GraphData",
						edges: [
							{
								from: "1",
								to: "2",
								label: "test",
							},
						],
						nodes: [
							{ id: "1", label: "foo" },
							{ id: "2", label: "bar" },
						],
					}}
				/>
		*/
	}

	renderContent(): JSX.Element {
		const s = this.props.model.state;
		if (s.kind === "loading") {
			return <NoData label="Loading" />;
		} else if (s.kind === "error") {
			return <NoData label={"Error: " + s.message} />;
		} else if (s.kind === "noExpression") {
			return <NoData label="No Expression" />;
		} else if (s.kind === "noDebugSession") {
			return <NoData label="No Debug Session" />;
		} else if (s.kind === "data") {
			const data = s.result.data;

			if (data.kind.tree) {
				const d = data as CommonDataTypes.TreeNodeData;
				const m = createTreeViewModelFromTreeNodeData(d.root);
				return <TreeView model={m} />;
			} else {
				return <pre>{JSON.stringify(s.result)}</pre>;
			}
		} else {
			const nvr: never = s;
			return <div />;
		}
	}
}

@observer
class NoData extends React.Component<{ label: string }> {
	@observable height = 0;
	@observable width = 0;

	render() {
		const { width, height } = this;
		return (
			<Measure
				client={true}
				onResize={e => {
					if (e.client) {
						this.height = e.client.height;
						this.width = e.client.width;
					}
				}}
			>
				{({ measureRef }) => (
					<div className="component-NoData" ref={measureRef}>
						<svg>
							<line x1={0} y1={0} x2={width} y2={height} />
							<line x1={width} y1={0} x2={0} y2={height} />
							<rect
								x={width / 2 - 50}
								y={height / 2 - 20}
								width={100}
								height={40}
							/>
							<text
								x={width / 2}
								y={height / 2}
								textAnchor="middle"
								alignmentBaseline="central"
								children={this.props.label}
							/>
						</svg>
					</div>
				)}
			</Measure>
		);
	}
}

export class ExpandButton extends React.Component<{
	expanded: boolean;
	setExpanded: (val: boolean) => void;
}> {
	render() {
		return (
			<div
				onClick={() => this.props.setExpanded(!this.props.expanded)}
				className={classnames(
					"component-ExpandButton",
					this.props.expanded && "expanded"
				)}
			/>
		);
	}
}

function NamedSelect(props: {
	name: string;
	selected: number;
	options: SelectableItem[];
}) {
	return (
		<div className="component-NamedSelect">
			<div className="part-Select">
				<Select {...props} />
			</div>
			<div>{props.name}</div>
		</div>
	);
}

interface SelectableItem {
	label: string;
}

@observer
export class Select extends React.Component<{
	selected: number;
	options: SelectableItem[];
}> {
	@computed get selected(): SelectableItem {
		return this.props.options[this.props.selected];
	}

	render() {
		return (
			<div className="component-Select">
				<Popover
					position="auto-start"
					modifiers={{ arrow: { enabled: false } }}
					usePortal={false}
				>
					<button className="part-button">
						{this.selected.label}
					</button>
					<div className={"part-content"}>
						{this.props.options.map((o, idx) => (
							<div key={idx}>{o.label}</div>
						))}
					</div>
				</Popover>
			</div>
		);
	}
}
