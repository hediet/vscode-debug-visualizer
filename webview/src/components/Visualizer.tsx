import * as React from "react";
import { Model } from "../model/Model";
import { observer } from "mobx-react";
import { NoData } from "./NoData";
import { FormattedMessage } from "debug-visualizer/src/contract";

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
			return <NoData>Loading</NoData>;
		} else if (s.kind === "error") {
			return (
				<NoData>
					<Message message={s.message} />
				</NoData>
			);
		} else if (s.kind === "noExpression") {
			return <NoData>No Expression Entered</NoData>;
		} else if (s.kind === "noDebugSession") {
			return <NoData>No Active Debug Session</NoData>;
		} else if (s.kind === "data") {
			const vis = this.props.model.visualizations;
			if (!vis || !vis.visualization) {
				return <NoData>No Visualization Available</NoData>;
			}

			return vis.visualization.render();
		} else {
			const nvr: never = s;
			return <div />;
		}
	}
}

function Message(props: { message: FormattedMessage }): React.ReactElement {
	if (typeof props.message === "string") {
		return <span>{props.message}</span>;
	} else if (props.message.kind === "list") {
		return (
			<div>
				{props.message.items.map((i, idx) => (
					<p>
						<Message key={idx} message={i} />
					</p>
				))}
			</div>
		);
	} else if (props.message.kind === "inlineList") {
		return (
			<div>
				{props.message.items.map((i, idx) => (
					<Message key={idx} message={i} />
				))}
			</div>
		);
	} else if (props.message.kind === "code") {
		return <pre>{props.message.content}</pre>;
	}

	throw new Error("Bug");
}
