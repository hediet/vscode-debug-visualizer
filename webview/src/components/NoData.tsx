import React = require("react");
import { observer } from "mobx-react";
import { observable } from "mobx";
import Measure from "react-measure";

@observer
export class NoData extends React.Component<{ children: React.ReactChild }> {
	@observable size = { width: 0, height: 0 };
	@observable innerSize = { width: 0, height: 0 };

	render() {
		const { width, height } = this.size;
		const { width: innerWidth, height: innerHeight } = this.innerSize;
		return (
			<Measure
				client={true}
				onResize={e => {
					if (e.client) {
						this.size = {
							height: e.client.height,
							width: e.client.width,
						};
					}
				}}
			>
				{({ measureRef }) => (
					<div
						className="component-NoData"
						ref={measureRef}
						style={{ position: "relative" }}
					>
						<svg>
							<line x1={0} y1={0} x2={width} y2={height} />
							<line x1={width} y1={0} x2={0} y2={height} />
						</svg>
						<div
							className="part-content"
							style={{
								position: "absolute",
								overflow: "auto",
								width: "100%",
								height: "100%",
							}}
						>
							<Measure
								client={true}
								onResize={e => {
									if (e.client) {
										this.innerSize = {
											height: e.client.height,
											width: e.client.width,
										};
									}
								}}
							>
								{({ measureRef }) => (
									<div
										className="part-content-inner"
										ref={measureRef}
										style={{
											position: "relative",
											width: "fit-content",
											height: "fit-content",
											padding: 10,
											left: Math.max(
												0,
												width / 2 - innerWidth / 2
											),
											top: Math.max(
												0,
												height / 2 - innerHeight / 2
											),
										}}
									>
										{this.props.children}
									</div>
								)}
							</Measure>
						</div>
					</div>
				)}
			</Measure>
		);
	}
}
