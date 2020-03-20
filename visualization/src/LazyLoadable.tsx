import * as React from "react";
import { observable, runInAction } from "mobx";
import { observer } from "mobx-react";

export function makeLazyLoadable<TProps>(
	selector: () => Promise<React.ComponentClass<TProps>>
): React.ComponentClass<TProps> {
	@observer
	class MyComponent extends React.Component<TProps> {
		@observable
		component: React.ComponentClass<TProps> | undefined;

		async componentDidMount() {
			const result = await selector();
			runInAction("Set Lazily Loaded Component", () => {
				this.component = result;
			});
		}

		render() {
			if (!this.component) {
				return <div>Loading...</div>;
			}
			const C = this.component;
			return <C {...this.props} />;
		}
	}

	return MyComponent;
}
