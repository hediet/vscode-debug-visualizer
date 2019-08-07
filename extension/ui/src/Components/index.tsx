import React = require("react");
import { Model } from "../Model/Model";
import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import { Popover, Button, Spinner } from "@blueprintjs/core";
import classnames = require("classnames");
import { DataExtractorInfo } from "@hediet/debug-visualizer-data-extraction";
import { Visualizer } from "./Visualizer";
import { ExpressionInput } from "./ExpressionInput";

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
							<div className="part-expression-input ">
								<ExpressionInput model={m} />
							</div>
							<div style={{ width: 4 }} />
							{m.loading ? (
								<div style={{ padding: "0 4px" }}>
									<Spinner size={Spinner.SIZE_SMALL} />
								</div>
							) : (
								<Button
									minimal
									small
									className="part-icon"
									icon="refresh"
									onClick={() => m.refresh()}
								/>
							)}
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
