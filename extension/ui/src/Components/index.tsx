import React = require("react");
import { Model } from "../Model";
import { observer } from "mobx-react";
import { observable, action, computed } from "mobx";
import { Popover, Icon, Button, Spinner, InputGroup } from "@blueprintjs/core";
import classnames = require("classnames");
import Measure from "react-measure";
import { DataExtractorInfo } from "@hediet/debug-visualizer-data-extraction";
import { knownVisualizations } from "../Visualizers";
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
						{this.expanded && <ExpandedOptions model={m} />}
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
export class ExpandedOptions extends React.Component<{ model: Model }> {
	render() {
		const m = this.props.model;
		let availableExtractors = new Array<DataExtractorInfo>();
		let selected = -1;
		if (m.state.kind === "data") {
			const result = m.state.result;
			availableExtractors = result.availableExtractors;
			selected = result.availableExtractors.findIndex(
				i => i.id === result.usedExtractor.id
			);
		}
		return (
			<>
				<div style={{ height: 6 }} />
				<div className="part-header-options">
					<NamedSelect
						name="Source"
						selected={0}
						options={[{ label: "js" }]}
						onSelected={item => {}}
					/>
					<div style={{ width: 10 }} />

					<NamedSelect
						name="Extractor"
						selected={selected}
						options={availableExtractors.map(e => ({
							label: e.name,
							id: e.id,
						}))}
						onSelected={item => {
							m.setPreferredExtractorId(item.id);
						}}
					/>
					<div style={{ width: 10 }} />

					<NamedSelect
						name="Visualizer"
						selected={0}
						onSelected={item => {
							m.setPreferredVisualizationId(item.id);
						}}
						options={
							m.visualizations
								? m.visualizations.allVisualizations.map(v => ({
										label: v.name,
										id: v.id,
								  }))
								: []
						}
					/>
				</div>
			</>
		);
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
		const model = this.props.model;
		return (
			<InputGroup
				small
				fill
				rightElement={
					model.loading ? (
						<Spinner size={Icon.SIZE_STANDARD} />
					) : (
						undefined
					)
				}
				value={this.currentExpression}
				onChange={
					((e: { target: { value: string } }) =>
						this.updateCurrentExpression(e.target.value)) as any
				}
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
			const vis = this.props.model.visualizations;
			if (!vis || !vis.visualization) {
				return <NoData label="No Visualization" />;
			}

			return vis.visualization.render();
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

function NamedSelect<T extends SelectableItem>(props: {
	name: string;
	selected: number;
	onSelected: (item: T) => void;
	options: T[];
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
export class Select<T extends SelectableItem> extends React.Component<{
	selected: number;
	onSelected: (item: T) => void;
	options: T[];
}> {
	@computed get selected(): T | undefined {
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
						{this.selected ? this.selected.label : "(none)"}
					</button>
					<div className={"part-content"}>
						{this.props.options.map((o, idx) => (
							<div
								key={idx}
								className="part-option"
								onClick={() => this.props.onSelected(o)}
							>
								{o.label}
							</div>
						))}
					</div>
				</Popover>
			</div>
		);
	}
}
