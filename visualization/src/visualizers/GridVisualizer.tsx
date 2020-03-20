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
import * as React from "react";
import { observer } from "mobx-react";
import { computed, action, observable } from "mobx";
import { Icon } from "@blueprintjs/core";

export class GridVisualizer extends Visualizer {
	visualize(data: ExtractedData, collector: VisualizationCollector): void {
		if (isCommonDataType(data, { array: true })) {
			collector.addVisualization({
				id: asVisualizationId("grid"),
				name: "Grid",
				priority: 90,
				render: () => <DecoratedGridComponent data={data} />,
			});
		}
	}
}

export class DecoratedGridComponent extends React.Component<{
	data: CommonDataTypes.Grid;
}> {
	render() {
		const d = this.props.data;

		const map = new Set<string>();
		function getUniqueId(tag: string): string {
			let n = 0;
			while (true) {
				const id = tag + (n === 0 ? "" : `-${n}`);
				if (!map.has(id)) {
					map.add(id);
					return id;
				}
				n++;
			}
		}

		const rows: GridComponent["props"]["rows"] = [];
		rows.push();
		let rowIdx = 0;
		let columnCount = 0;
		for (const row of d.rows) {
			columnCount = Math.max(columnCount, row.columns.length);
			rows.push({
				columns: row.columns.map((c, colIdx) => ({
					content: (
						<Cell>
							{c.content !== undefined ? c.content : c.tag || ""}
						</Cell>
					),
					id:
						c.tag !== undefined
							? getUniqueId(c.tag)
							: `${rowIdx}-${colIdx}`,
					color: c.color,
					kind: "data",
				})),
			});
			rowIdx++;
		}

		rows.unshift({
			columns: [...new Array(columnCount)].map((v, idx) => ({
				id: `column-header-${idx}`,
				content: <Cell>{idx}</Cell>,
				kind: "header",
			})),
		});

		if (d.markers) {
			for (const m of d.markers) {
				rows.push({
					columns: [],
				});
				const r = rows[rows.length - 1];
				for (let i = 0; i < m.column; i++) {
					r.columns.push({
						content: "",
						kind: "empty",
						id: `marker-spacer-${i}`,
					});
				}

				r.columns.push({
					id: m.id,
					kind: "empty",
					content: (
						<Cell>
							<Icon
								icon="arrow-up"
								color="var(--vscode-editor-foreground)"
							/>
							{m.label || m.id}
						</Cell>
					),
				});
			}
		}

		return (
			<div
				style={{
					height: "100%",
					justifyContent: "center",
					alignItems: "center",
					padding: 10,
					display: "flex",
				}}
			>
				<GridComponent rows={rows} markers={[]} />
			</div>
		);
	}
}

function Cell(props: { children: React.ReactNode }) {
	return (
		<div
			style={{
				padding: 10,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
			}}
		>
			{props.children}
		</div>
	);
}

interface CellData {
	content: React.ReactNode;
	id: string;
	color?: string;
	kind: "data" | "header" | "empty";
}

@observer
class GridComponent extends React.Component<{
	rows: {
		columns: CellData[];
	}[];
	markers: {
		id: string;

		row: number;
		column: number;
		rows?: number;
		columns?: number;

		label?: string;
		color?: string;
	}[];
}> {
	private readonly cells = new Map<string, CellInfo>();

	@computed get cellsGrid(): { maxWidth: number; grid: CellInfo[][] } {
		const unusedIds = new Set(this.cells.keys());

		const rows = this.props.rows;

		const grid = new Array<Array<CellInfo>>();

		let maxWidth = 0;
		for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
			const row = rows[rowIdx];
			maxWidth = Math.max(maxWidth, row.columns.length);
			const cellRow = new Array<CellInfo>();
			grid.push(cellRow);

			for (let colIdx = 0; colIdx < row.columns.length; colIdx++) {
				const col = row.columns[colIdx];
				const key = col.id;
				unusedIds.delete(key);
				let c = this.cells.get(key);
				if (!c) {
					// New cell
					c = new CellInfo(col);
					this.cells.set(key, c);
				} else {
					c.updateCellData(col);
				}
				cellRow.push(c);
			}
		}

		for (const id in unusedIds.values()) {
			this.cells.delete(id);
		}

		return { maxWidth, grid };
	}

	@computed
	private get layout(): {
		cells: {
			cell: CellInfo;
			top: number;
			left: number;
			width: number;
			height: number;
		}[];
		width: number;
		height: number;
	} {
		const { maxWidth, grid } = this.cellsGrid;

		const maxWidths = new Array<number>();
		for (let colIdx = 0; colIdx < maxWidth; colIdx++) {
			let maxWidth = 30;
			for (const row of grid) {
				const col = row[colIdx];
				if (col) {
					maxWidth = Math.max(maxWidth, col.contentWidth || 0);
				}
			}
			maxWidths.push(maxWidth);
		}

		const result = new Array<{
			cell: CellInfo;
			top: number;
			left: number;
			width: number;
			height: number;
		}>();

		let width = 0;
		let height = 0;
		let top = 0;
		let left = 0;

		for (const row of grid) {
			let maxHeight = 0;
			for (const col of row) {
				maxHeight = Math.max(maxHeight, col.contentHeight || 0);
			}

			for (let colIdx = 0; colIdx < row.length; colIdx++) {
				const maxWidth = maxWidths[colIdx];
				const col = row[colIdx];
				result.push({
					cell: col,
					top,
					left,
					height: maxHeight,
					width: maxWidth,
				});
				height = Math.max(height, top + maxHeight);
				width = Math.max(width, left + maxWidth);
				col.lastTop = col.top;
				col.lastLeft = col.left;
				col.top = top;
				col.left = left;

				col.lastContentArea = col.contentArea;
				col.contentArea = maxHeight * maxWidth;
				left += maxWidth;
			}

			left = 0;
			top += maxHeight;
		}

		result.sort((a, b) => a.cell.id.localeCompare(b.cell.id));
		return { cells: result, height, width };
	}

	render() {
		const l = this.layout;
		return (
			<div
				className="component-Grid"
				style={{
					position: "relative",
					height: l.height,
					width: l.width,
				}}
			>
				{l.cells.map(i => (
					<div
						key={i.cell.id}
						style={{
							position: "absolute",
							top: i.top,
							left: i.left,
							height: i.height,
							width: i.width,
							zIndex: i.cell.distance,
							transition:
								i.cell.lastContentArea !== 0 ? "all 1s" : "",
						}}
					>
						<div
							className={`part-${i.cell.kind}`}
							style={
								{
									empty: {},
									data: {
										display: "flex",
										overflow: "hidden",
										justifyContent: "center",
										margin: 2,
									},
									header: {
										overflow: "hidden",
										display: "flex",
										justifyContent: "center",
										margin: 2,
									},
								}[i.cell.kind]
							}
						>
							<div
								ref={i.cell.handleRef}
								style={{
									width: "fit-content",
									height: "fit-content",
								}}
							>
								{i.cell.content}
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	componentDidMount() {
		this.updateContentSize();
	}

	componentDidUpdate() {
		this.updateContentSize();
	}

	@action
	updateContentSize() {
		for (const c of this.cells.values()) {
			if (c.ref) {
				const r = c.ref.getBoundingClientRect();
				c.contentHeight = r.height + 6;
				c.contentWidth = r.width + 4;
			}
		}
	}
}

class CellInfo {
	@observable public contentWidth: number | undefined = undefined;
	@observable public contentHeight: number | undefined = undefined;

	public contentArea = 0;
	public lastContentArea = 0;

	public lastTop = 0;
	public top = 0;
	public lastLeft = 0;
	public left = 0;

	public get distance(): number {
		return Math.floor(
			Math.pow(this.top - this.lastTop, 2) +
				Math.pow(this.left - this.lastLeft, 2)
		);
	}

	content!: React.ReactNode;

	ref: HTMLDivElement | null = null;

	public readonly id: string;
	public readonly kind: CellData["kind"];

	constructor(cellData: CellData) {
		this.id = cellData.id;
		this.kind = cellData.kind;
		this.updateCellData(cellData);
	}

	public updateCellData(cellData: CellData) {
		this.content = cellData.content;
	}

	public readonly handleRef = (ref: HTMLDivElement | null) => {
		this.ref = ref;
	};
}
