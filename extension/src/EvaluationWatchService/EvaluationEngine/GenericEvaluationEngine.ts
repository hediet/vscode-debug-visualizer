import {
	createGraph,
	CreateGraphEdge,
	DataExtractionResult,
	DataExtractorId,
	GraphNode,
	GraphVisualizationData,
} from "@hediet/debug-visualizer-data-extraction";
import { EnhancedDebugSession } from "../../debugger/EnhancedDebugSession";
import {
	EvaluationEngine,
	Evaluator,
	EvaluationArgs,
} from "./EvaluationEngine";
import { parseEvaluationResultFromGenericDebugAdapter } from "./parseEvaluationResultFromGenericDebugAdapter";
import { FormattedMessage } from "../../webviewContract";
import { hotClass, registerUpdateReconciler } from "@hediet/node-reload";

registerUpdateReconciler(module);

@hotClass(module)
export class GenericEvaluationEngine implements EvaluationEngine {
	createEvaluator(session: EnhancedDebugSession): Evaluator | undefined {
		return new GenericEvaluator(session);
	}
}

export class GenericEvaluator implements Evaluator {
	public readonly languageId = "text";

	constructor(private readonly session: EnhancedDebugSession) {}

	public async evaluate({
		expression,
		preferredExtractorId,
		frameId,
	}: EvaluationArgs): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
	> {
		const finalExpression = this.getFinalExpression({
			expression,
			preferredExtractorId,
		});
		let reply: { result: string, variablesReference: number };
		try {
			reply = await this.session.evaluate({
				expression: finalExpression,
				frameId,
				context: this.getContext(),
			});

			// Use structural information about variables
			// from the evaluation response if present.
			if (reply.variablesReference) {
				let graph: GraphVisualizationData = {
					kind: { graph: true },
					nodes: [],
					edges: []
				};
				await this.constructGraphFromVariablesReference(reply.result, reply.variablesReference, graph);

				return {
					kind: "data",
					result: {
						availableExtractors: [],
						usedExtractor: {
							id: "generic" as any,
							name: "Generic",
							priority: 1,
						},
						data: graph,
					},
				}
			} else {
				return parseEvaluationResultFromGenericDebugAdapter(reply.result, {
					debugAdapterType: this.session.session.configuration.type,
				});
			}
		} catch (error) {
			return {
				kind: "error",
				message: {
					kind: "list",
					items: [
						"An error occurred while evaluating the expression:",
						error.message,
						`Used debug adapter: ${this.session.session.configuration.type}`,
						{
							kind: "inlineList",
							items: [
								"Evaluated expression is",
								{ kind: "code", content: finalExpression },
							],
						},
					],
				},
			};
		}
	}

	private async constructGraphFromVariablesReference(
		label: string,
		variablesReference: number,
		graph: GraphVisualizationData,
		isTopLevel: boolean = true,
		knownNodeIds: { [ref: number]: string; } = {},
		recursionDepth: number = 0,
		maxRecursionDepth: number = 30,
		maxKnownObjects: number = 100,
	): Promise<any> {
		var result: GraphNode = {
			id: `${variablesReference}`,
			label,
			color: isTopLevel ? "lightblue" : undefined,
			shape: "box",
		};
		knownNodeIds[variablesReference] = result.id;

		const canRecurse = recursionDepth < maxRecursionDepth && Object.keys(knownNodeIds).length < maxKnownObjects;

		if (variablesReference > 0 && canRecurse) {
			for (const variable of await this.session.getVariables({ variablesReference })) {
				// If the object is known, we have a (potentially cyclic) reference
				// Otherwise, recurse on the object.
				if (!(variable.variablesReference in knownNodeIds)) {
					await this.constructGraphFromVariablesReference(
						variable.value,
						variable.variablesReference,
						graph,
						false, // isTopLevel
						knownNodeIds,
						recursionDepth + 1,
						maxRecursionDepth,
						maxKnownObjects
					);
				}

				graph.edges.push({ from: result.id, to: knownNodeIds[variable.variablesReference] });
			}
		}

		graph.nodes.push(result);
	}

	protected getFinalExpression(args: {
		expression: string;
		preferredExtractorId: DataExtractorId | undefined;
	}): string {
		return args.expression;
	}

	protected getContext(): "watch" | "repl" {
		// we will use "repl" as default so that results are not truncated.
		return "repl";
	}
}
