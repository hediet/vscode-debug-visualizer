import * as React from "react";
import { observer } from "mobx-react";
import { observable, action } from "mobx";
import TextareaAutosize from "react-autosize-textarea";

export class ExpressionModel {
	@observable
	private _value: string;

	constructor(initialValue: string) {
		this._value = initialValue;
	}

	public get value(): string {
		return this._value;
	}

	public setValue(newValue: string): void {
		this._value = newValue;
	}
}

@observer
export class LightExpressionInput extends React.Component<{
	model: ExpressionModel;
}> {
	@observable localText: string | undefined = undefined;

	get text(): string {
		if (this.localText !== undefined) {
			return this.localText;
		}
		return this.props.model.value;
	}

	render() {
		return (
			<div>
				<TextareaAutosize
					value={this.text}
					spellCheck={false}
					onChange={e => (this.localText = e.currentTarget.value)}
					onKeyDown={e => {
						if (e.keyCode == 9 || e.which == 9) {
							// enable tab
							const target = e.currentTarget;
							e.preventDefault();
							var s = target.selectionStart;
							target.value =
								target.value.substring(
									0,
									target.selectionStart
								) +
								"\t" +
								target.value.substring(target.selectionEnd);
							target.selectionEnd = s + 1;
						}
					}}
					style={{
						width: "100%",
						resize: "none",
					}}
					onBlur={this.handleBlur}
				/>
			</div>
		);
	}

	@action.bound
	private handleBlur() {
		if (this.localText !== undefined) {
			this.props.model.setValue(this.localText);
		}
		this.localText = undefined;
	}
}
