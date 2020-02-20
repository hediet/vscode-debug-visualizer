import React = require("react");
import { Popover } from "@blueprintjs/core";
import { DataExtractorInfo } from "@hediet/debug-visualizer-data-extraction";
import { computed } from "mobx";
import { observer } from "mobx-react";
import { Model } from "../Model/Model";
import { VisualizationId } from "../Visualizers/Visualizer";

@observer
export class VisualizerHeaderDetails extends React.Component<{ model: Model }> {
	render() {
		const m = this.props.model;
		let availableExtractors = new Array<DataExtractorInfo>();
		let selectedExtractor = -1;
		if (m.state.kind === "data") {
			const result = m.state.result;
			availableExtractors = result.availableExtractors;
			selectedExtractor = result.availableExtractors.findIndex(
				i => i.id === result.usedExtractor.id
			);
		}

		let visualizations = new Array<{
			label: string;
			id: VisualizationId;
		}>();
		let selectedVisualization = -1;
		if (m.visualizations) {
			visualizations = m.visualizations.allVisualizations.map(v => ({
				label: v.name,
				id: v.id,
			}));
			if (m.visualizations.visualization) {
				selectedVisualization = visualizations.findIndex(
					v => v.id === m.visualizations!.visualization!.id
				);
			}
		}

		return (
			<div
				className="component-VisualizerHeaderDetails"
				style={{ display: "flex", alignItems: "center" }}
			>
				<NamedSelect
					name="Source"
					selected={0}
					options={[{ label: "js" }]}
					onSelected={item => {}}
				/>
				<div style={{ width: 10 }} />

				<NamedSelect
					name="Extractor"
					selected={selectedExtractor}
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
					selected={selectedVisualization}
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
		<div
			className="component-NamedSelect"
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
			}}
		>
			<div className="part-Select" style={{ minWidth: 100 }}>
				<Select {...props} />
			</div>
			<div className="part-Name">{props.name}</div>
		</div>
	);
}

interface SelectableItem {
	label: string;
}

@observer
class Select<T extends SelectableItem> extends React.Component<{
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
					<button className="part-Button">
						{this.selected ? this.selected.label : "(none)"}
					</button>
					<div className="part-Items">
						{this.props.options.map((o, idx) => (
							<div
								key={idx}
								className="part-Item"
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
