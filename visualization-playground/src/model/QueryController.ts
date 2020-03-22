import { Model } from "./Model";
import { autorun } from "mobx";

export class QueryController {
	constructor(private readonly model: Model) {
		this.loadFromQuery();
		autorun(() => {
			this.updateQuery();
		});
	}

	loadFromQuery() {
		const url = new URL(window.location.href);
		const val = url.searchParams.get("value");
		if (val) {
			this.model.jsonExpression.setValue(val);
		}
	}

	updateQuery() {
		const url = new URL(window.location.href);
		url.searchParams.set("value", this.model.jsonExpression.value);

		history.replaceState(null, document.title, url.toString());
	}
}
