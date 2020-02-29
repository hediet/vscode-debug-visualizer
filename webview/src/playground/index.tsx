import React = require("react");
import "../style.scss";
import { DecoratedGridComponent } from "../visualizers/GridVisualizer";
import { observable } from "mobx";
import { observer } from "mobx-react";

@observer
export class Playground extends React.Component {
	@observable
	private phase = 0;

	componentDidMount() {
		setInterval(() => {
			this.phase++;
		}, 2000);
	}

	render() {
		return (
			<div
				style={{
					width: "100%",
					height: "100%",
					background: "lightgray",
					padding: 10,
				}}
			>
				<div
					style={{
						background: "white",
					}}
				>
					<DecoratedGridComponent
						data={{
							kind: { array: true },
							rows: [
								{
									columns: [
										[
											{ tag: "h" },
											{ tag: "e" },
											{ tag: "l" },
											{ tag: "l" },
											{ tag: "o" },
										],
										[
											{ tag: "e" },
											{ tag: "h" },
											{ tag: "l" },
											{ tag: "l" },
											{ tag: "o" },
										],
									][this.phase % 2],
								},
							],
						}}
					/>
				</div>
			</div>
		);
	}
}
