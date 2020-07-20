import * as React from "react";
import { Button, Spinner } from "@blueprintjs/core";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import { Model } from "../model/Model";
import { ExpressionInput } from "./ExpressionInput";
import { Visualizer } from "./Visualizer";
import classnames = require("classnames");
import { VisualizerHeaderDetails } from "./VisualizerHeaderDetails";

@observer
export class GUI extends React.Component<{ model: Model }> {
	render() {
		const m = this.props.model;
		return (
			<div
				className="component-GUI"
				tabIndex={0}
				style={{
					display: "flex",
					flexDirection: "column",
					height: "100%",
				}}
			>
				<div className="part-Header">
					<VisualizerHeader model={m} />
				</div>
				<div
					className="part-Visualizer"
					style={{ flex: 1, minHeight: 0 }}
				>
					<Visualizer model={m} />
				</div>
			</div>
		);
	}
}

@observer
export class VisualizerHeader extends React.Component<{ model: Model }> {
	@observable expanded = false;

	render() {
		const m = this.props.model;
		return (
			<div
				className="component-VisualizerHeader"
				style={{ display: "flex", flexDirection: "row" }}
			>
				<div
					className={classnames(
						"part-ExpandButton",
						this.expanded && "expanded"
					)}
					onClick={this.toggleExpanded}
				/>
				<div
					className="part-HeaderContent"
					style={{
						flex: 1,
						minWidth: 0,
						display: "flex",
						flexDirection: "column",
					}}
				>
					<div className="part-HeaderMain">
						<VisualizerHeaderMain model={m} />
					</div>

					{this.expanded && (
						<>
							<div style={{ height: 6 }} />
							<VisualizerHeaderDetails model={m} />
						</>
					)}
				</div>
			</div>
		);
	}

	@action.bound
	toggleExpanded() {
		this.expanded = !this.expanded;
	}
}

@observer
export class VisualizerHeaderMain extends React.Component<{ model: Model }> {
	render() {
		const m = this.props.model;
		return (
			<div
				className="component-VisualizerHeaderMain"
				style={{
					display: "flex",
					alignItems: "center",
				}}
			>
				<div
					className="part-ExpressionInput "
					style={{ flex: 1, minWidth: 0 }}
				>
					<ExpressionInput model={m} />
				</div>
				<div style={{ width: 4 }} />
				{!m.isPolling &&
					(m.loading ? (
						<div style={{ padding: "0 4px" }}>
							<Spinner size={Spinner.SIZE_SMALL} />
						</div>
					) : (
						<Button
							minimal
							small
							className="part-Icon"
							icon="refresh"
							onClick={() => m.refresh()}
						/>
					))}
				<Button
					minimal
					small
					className="part-Icon"
					icon="log-in"
					onClick={() => m.openBrowser()}
				/>
				{/*
					TODO
					<Button
						minimal
						small
						className="part-Icon"
						icon="locate"
						onClick={() => m.useSelectionAsExpression()}
					/>
					*/}
			</div>
		);
	}
}
