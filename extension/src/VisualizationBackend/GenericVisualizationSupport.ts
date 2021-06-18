import {
	DataExtractionResult,
	DataExtractorId,
	GraphNode,
	GraphVisualizationData,
} from "@hediet/debug-visualizer-data-extraction";
import { DebugSessionProxy } from "../proxies/DebugSessionProxy";
import {
	DebugSessionVisualizationSupport,
	VisualizationBackend,
	GetVisualizationDataArgs,
	VisualizationBackendBase,
} from "./VisualizationBackend";
import { parseEvaluationResultFromGenericDebugAdapter } from "./parseEvaluationResultFromGenericDebugAdapter";
import { FormattedMessage } from "../webviewContract";
import { hotClass, registerUpdateReconciler } from "@hediet/node-reload";
import { DebuggerViewProxy } from "../proxies/DebuggerViewProxy";

registerUpdateReconciler(module);

@hotClass(module)
export class GenericVisualizationSupport
	implements DebugSessionVisualizationSupport {
	constructor(private readonly debuggerView: DebuggerViewProxy) {}

	createBackend(
		session: DebugSessionProxy
	): VisualizationBackend | undefined {
		return new GenericVisualizationBackend(session, this.debuggerView);
	}
}

export class GenericVisualizationBackend extends VisualizationBackendBase {
	public readonly expressionLanguageId = "text";

	constructor(
		debugSession: DebugSessionProxy,
		debuggerView: DebuggerViewProxy
	) {
		super(debugSession, debuggerView);
	}

	public async getVisualizationData({
		expression,
		preferredExtractorId,
	}: GetVisualizationDataArgs): Promise<
		| { kind: "data"; result: DataExtractionResult }
		| { kind: "error"; message: FormattedMessage }
	> {
		const frameId = this.debuggerView.getActiveStackFrameId(
			this.debugSession
		);

		const finalExpression = this.getFinalExpression({
			expression,
			preferredExtractorId,
		});
		let reply: { result: string; variablesReference: number };
		try {
			reply = await this.debugSession.evaluate({
				expression: finalExpression,
				frameId,
				context: this.getContext(),
			});

			// Use structural information about variables
			// from the evaluation response if present.
			if (reply.variablesReference) {
				const graph = await this.constructGraphFromVariablesReference(
					reply.result,
					reply.variablesReference
				);

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
				};
			} else {
				return parseEvaluationResultFromGenericDebugAdapter(
					reply.result,
					{
						debugAdapterType: this.debugSession.session
							.configuration.type,
					}
				);
			}
		} catch (error) {
			return {
				kind: "error",
				message: {
					kind: "list",
					items: [
						"An error occurred while evaluating the expression:",
						error.message,
						`Used debug adapter: ${this.debugSession.session.configuration.type}`,
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

	/**
	 * Constructs GraphVisualizationData from a DAP variables
	 * reference by successively querying the debug adapter for
	 * variables. Objects are considered to be equivalent if
	 * they share the same variables reference (this is important
	 * for representing cyclic relationships).
	 *
	 * @param rootLabel - The root object's label
	 * @param rootVariablesReference - The root object's DAP variables reference
	 * @param maxDepth - The maximum depth to search at
	 * @param maxKnownNodes - The maximum number of nodes
	 */
	private async constructGraphFromVariablesReference(
		rootLabel: string,
		rootVariablesReference: number,
		maxDepth: number = 30,
		maxKnownNodes: number = 50
	): Promise<GraphVisualizationData> {
		// Perform a breadth-first search on the object to construct the graph

		const graph: GraphVisualizationData = {
			kind: { graph: true },
			nodes: [],
			edges: [],
		};
		const knownNodeIds: { [ref: number]: string } = {};
		const bfsQueue: {
			source: { id: string; name: string } | undefined;
			label: string;
			variablesReference: number;
			depth: number;
		}[] = [
			{
				source: undefined,
				label: rootLabel,
				variablesReference: rootVariablesReference,
				depth: 0,
			},
		];

		let knownCount: number = 0;

		do {
			const variable = bfsQueue.shift()!;
			const hasChilds = variable.variablesReference > 0;

			if (variable.depth > maxDepth) {
				break;
			}

			let nodeId: string;

			if (!hasChilds || !(variable.variablesReference in knownNodeIds)) {
				// The variable is a leaf or an unvisited object: create the node.

				const node: GraphNode = {
					id: hasChilds
						? `${variable.variablesReference}`
						: `__${variable.label}@${knownCount}__`,
					label: variable.label,
					color: variable.depth == 0 ? "lightblue" : undefined,
					shape: "box",
				};

				graph.nodes.push(node);
				knownCount++;

				if (hasChilds) {
					knownNodeIds[variable.variablesReference] = node.id;

					for (const child of await this.debugSession.getVariables({
						variablesReference: variable.variablesReference,
					})) {
						bfsQueue.push({
							source: { id: node.id, name: child.name },
							label: child.value,
							variablesReference: child.variablesReference,
							depth: variable.depth + 1,
						});
					}
				}

				nodeId = node.id;
			} else {
				// The variable is a visited object (e.g. due to a cyclic reference)

				nodeId = knownNodeIds[variable.variablesReference];
			}

			if (variable.source) {
				graph.edges.push({
					from: variable.source.id,
					to: nodeId,
					label: variable.source.name,
				});
			}
		} while (bfsQueue.length > 0 && knownCount <= maxKnownNodes);

		return graph;
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
