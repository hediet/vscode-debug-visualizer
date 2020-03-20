import { ExtractedData } from "@hediet/debug-visualizer-data-extraction";

export interface VisualizationId extends String {
	__brand: "VisualizationId";
}

export function asVisualizationId(id: string): VisualizationId {
	return (id as unknown) as VisualizationId;
}

export interface Visualization {
	readonly name: string;
	readonly id: VisualizationId;
	readonly priority: number;
	render(): React.ReactElement;
}

export interface VisualizationCollector {
	addVisualization(visualization: Visualization): void;
}

export abstract class Visualizer {
	abstract visualize(
		data: ExtractedData,
		collector: VisualizationCollector
	): void;

	getVisualizationsArray(data: ExtractedData): Visualization[] {
		const result = new Array<Visualization>();
		this.visualize(data, {
			addVisualization(visualization) {
				result.push(visualization);
			},
		});
		return result;
	}

	getBestVisualization(
		data: ExtractedData,
		preferredVisualization: VisualizationId | undefined
	): {
		visualization: Visualization | undefined;
		allVisualizations: Visualization[];
	} {
		const allVisualizations = this.getVisualizationsArray(data);
		allVisualizations.sort((a, b) => b.priority - a.priority);

		let visualization: Visualization | undefined = allVisualizations[0];
		if (preferredVisualization) {
			const preferred = allVisualizations.find(
				vis => vis.id === preferredVisualization
			);
			if (preferred) {
				visualization = preferred;
			}
		}
		return { visualization, allVisualizations };
	}
}

export class ComposedVisualizer extends Visualizer {
	constructor(private readonly composedProviders: ReadonlyArray<Visualizer>) {
		super();
	}

	visualize(data: ExtractedData, collector: VisualizationCollector): void {
		for (const c of this.composedProviders) {
			c.visualize(data, collector);
		}
	}
}
