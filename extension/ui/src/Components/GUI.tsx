import React = require("react");
import { Button, Spinner } from "@blueprintjs/core";
import { observable } from "mobx";
import { observer } from "mobx-react";
import { Model } from "../Model/Model";
import { ExpressionInput } from "./ExpressionInput";
import { Visualizer } from "./Visualizer";
import classnames = require("classnames");
import { ExpandedOptions } from "./ExpandedOptions";

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
							{/*
							TODO
							<Button
								minimal
								small
								className="part-icon"
								icon="locate"
								onClick={() => m.useSelectionAsExpression()}
							/>
							*/}
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
