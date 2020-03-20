import * as monaco from "monaco-editor";
import { Model } from "./Model";
import { Disposable } from "@hediet/std/disposable";
import { autorun } from "mobx";

export class MonacoBridge {
	public readonly dispose = Disposable.fn();

	constructor(private readonly model: Model) {
		this.dispose.track({
			dispose: autorun(() => {
				monaco.editor.setTheme(
					model.theme === "light" ? "vs-light" : "vs-dark"
				);
			}),
		});
	}
}
