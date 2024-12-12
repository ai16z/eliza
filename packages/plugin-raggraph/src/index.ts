import { elizaLogger } from "@ai16z/eliza";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@ai16z/eliza";
import { createGraphRAG } from "./driver";
import { validateRaggraphConfig } from "./environment";

export async function initializeRAGGraph(runtime: IAgentRuntime) {
    const config = await validateRaggraphConfig(runtime);
    return createGraphRAG({
        neo4jUri: config.NEO4J_URI,
        neo4jUser: config.NEO4J_USER,
        neo4jPassword: config.NEO4J_PASSWORD,
    });
}

const ragQuery: Action = {
    name: "RAG_QUERY",
    similes: [
        "SEARCH_KNOWLEDGE",
        "QUERY_GRAPH",
        "FIND_RELATED",
        "SEARCH_DOCUMENTS",
        "RETRIEVE_INFO",
    ],
    description: "Query the knowledge graph for relevant information",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        try {
            await validateRaggraphConfig(runtime);
            return true;
        } catch {
            return false;
        }
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: Record<string, any>,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Composing state for message:", message);
        state = (await runtime.composeState(message)) as State;

        try {
            const rag = await initializeRAGGraph(runtime);
            const query = message.content.text;

            elizaLogger.log("Executing RAG query:", query);
            const result = await rag.query(query);

            // Close the connection after query
            await rag.close();

            callback({
                text: "Here's what I found:",
                attachments: [
                    {
                        id: crypto.randomUUID(),
                        title: "Search Results",
                        source: "raggraph",
                        description: "Knowledge Graph Query Results",
                        text: result.fullContext,
                        metadata: {
                            confidence: result.confidence,
                            sources: result.sources,
                        },
                    },
                ],
            });
        } catch (error) {
            elizaLogger.error("RAG query failed:", error);
            throw error;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What do you know about neural networks?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me search our knowledge base for information about neural networks.",
                    action: "RAG_QUERY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Find information about machine learning" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll search our knowledge graph for machine learning information.",
                    action: "RAG_QUERY",
                },
            },
        ],
    ],
} as Action;

export const raggraphPlugin: Plugin = {
    name: "raggraph",
    description: "Knowledge graph querying and retrieval",
    actions: [ragQuery],
    evaluators: [],
    providers: [],
};
