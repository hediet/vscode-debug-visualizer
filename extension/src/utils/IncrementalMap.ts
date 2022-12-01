import { Disposable } from "@hediet/std/disposable";
import { observable, autorun } from "mobx";

export class IncrementalMap<TKey, TValue extends Disposable> {
	public readonly map: Map<TKey, TValue> = new Map();

	constructor(
		private readonly getKeys: () => TKey[],
		private readonly getValue: (key: TKey) => TValue
	) {
		this.dispose.track({
			dispose: autorun(() => {
				const keys = this.getKeys();
				const toRemove = new Set(this.map.keys());
				for (const key of keys) {
					toRemove.delete(key);
					if (!this.map.has(key)) {
						this.map.set(key, this.getValue(key));
					}
				}
				for (const key of toRemove) {
					this.map.get(key)!.dispose();
					this.map.delete(key);
				}
			}),
		});
	}

	public readonly dispose = Disposable.fn();
}
