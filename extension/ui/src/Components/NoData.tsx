import React = require("react");
import { observer } from "mobx-react";
import { observable } from "mobx";
import Measure from "react-measure";

@observer
export class NoData extends React.Component<{ label: string }> {
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
