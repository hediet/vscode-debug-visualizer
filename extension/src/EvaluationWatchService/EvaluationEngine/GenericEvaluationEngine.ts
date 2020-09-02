import {
	createGraph,
	CreateGraphEdge,
	DataExtractionResult,
	DataExtractorId,
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
				let obj = await this.constructObjectFromVariablesReference(reply.variablesReference);

				return {
					kind: "data",
					result: {
						availableExtractors: [],
						usedExtractor: {
							id: "generic" as any,
							name: "Generic",
							priority: 1,
						},
						data: createGraph(
							[obj],
							(item: any) => {
								function isObject(val: any): boolean {
									return val && typeof val === "object";
								}

								const edges = new Array<CreateGraphEdge<any>>();
								for (const [key, val] of Object.entries(item)) {
									if (isObject(val)) {
										edges.push({ label: key, to: val });
									}
								}

								const isTopLevel = item === obj;
								const label = isObject(item) ? "object" : `${item}`;

								return {
									shape: "box",
									edges,
									color: isTopLevel ? "lightblue" : undefined,
									label,
								};
							}
						),
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

	private async constructObjectFromVariablesReference(
		variablesReference: number,
		knownObjects: { [ref: number]: any; } = {},
		recursionDepth: number = 0,
		maxRecursionDepth: number = 30,
		maxKnownObjects: number = 100,
	): Promise<any> {
		var result: any = {};
		knownObjects[variablesReference] = result;

		const canRecurse = recursionDepth < maxRecursionDepth && Object.keys(knownObjects).length < maxKnownObjects;

		for (const variable of await this.session.getVariables({ variablesReference })) {
			let child: any;

			if (variable.variablesReference > 0 && variable.variablesReference in knownObjects) {
				// If the object is known, we have a (potentially cyclic) reference
				child = knownObjects[variable.variablesReference];
			} else if (variable.variablesReference > 0 && canRecurse) {
				// Recurse on a new object
				child = await this.constructObjectFromVariablesReference(variable.variablesReference, knownObjects, recursionDepth + 1, maxRecursionDepth);
			} else {
				// If there are no childs, just assign the value
				child = variable.value;
			}

			result[variable.name] = child;
		}

		return result;
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
