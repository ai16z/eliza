import {
    Action,
    elizaLogger,
    IAgentRuntime,
    Memory,
    HandlerCallback,
    State,
    getEmbeddingZeroVector,
} from "@elizaos/core";

interface TokenProfile {
    url: string;
    description?: string;
    chainId: string;
    tokenAddress: string;
}

const createTokenMemory = async (
    runtime: IAgentRuntime,
    state: State,
    formattedOutput: string
): Promise<Memory> => {
    const memory: Memory = {
        userId: runtime.agentId,
        agentId: runtime.agentId,
        roomId: state.roomId,
        content: { text: formattedOutput },
        createdAt: Date.now(),
        embedding: getEmbeddingZeroVector(),
    };
    await runtime.messageManager.createMemory(memory);
    return memory;
};

export const getLatestTokensAction: Action = {
    name: "GET_LATEST_TOKENS",
    description: "Get the latest tokens from DexScreener API",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        elizaLogger.log("Validating runtime for GET_LATEST_TOKENS...");
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Starting GET_LATEST_TOKENS handler...");

        const recentMessage = await runtime.messageManager.getMemories({
            roomId: state.roomId,
            count: 10,
            unique: false,
        });

        try {
            const response = await fetch(
                "https://api.dexscreener.com/token-profiles/latest/v1",
                {
                    method: "GET",
                    headers: {
                        accept: "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tokens: TokenProfile[] = await response.json();

            const formattedOutput = tokens
                .map((token) => {
                    const description =
                        token.description || "No description available";
                    return `Chain: ${token.chainId}\nToken Address: ${token.tokenAddress}\nURL: ${token.url}\nDescription: ${description}\n\n`;
                })
                .join("");

            state = (await runtime.composeState(
                await createTokenMemory(runtime, state, formattedOutput)
            )) as State;

            callback(
                {
                    text: formattedOutput,
                },
                []
            );
        } catch (error) {
            elizaLogger.error("Error fetching latest tokens:", error);
            callback(
                {
                    text: "Failed to fetch latest tokens. Please check the logs for more details.",
                },
                []
            );
        }
    },
    examples: [],
    similes: [
        "GET_LATEST_TOKENS",
        "FETCH_NEW_TOKENS",
        "CHECK_RECENT_TOKENS",
        "LIST_NEW_TOKENS",
    ],
};

export const getLatestBoostedTokensAction: Action = {
    name: "GET_LATEST_BOOSTED_TOKENS",
    description: "Get the latest boosted tokens from DexScreener API",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        elizaLogger.log("Validating runtime for GET_LATEST_BOOSTED_TOKENS...");
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Starting GET_LATEST_BOOSTED_TOKENS handler...");

        try {
            const response = await fetch(
                "https://api.dexscreener.com/token-boosts/latest/v1",
                {
                    method: "GET",
                    headers: {
                        accept: "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tokens: TokenProfile[] = await response.json();

            const formattedOutput = tokens
                .map((token) => {
                    const description =
                        token.description || "No description available";
                    return `Chain: ${token.chainId}\nToken Address: ${token.tokenAddress}\nURL: ${token.url}\nDescription: ${description}\n\n`;
                })
                .join("");

            state = (await runtime.composeState(
                await createTokenMemory(runtime, state, formattedOutput)
            )) as State;

            callback(
                {
                    text: formattedOutput,
                },
                []
            );
        } catch (error) {
            elizaLogger.error("Error fetching latest boosted tokens:", error);
            callback(
                {
                    text: "Failed to fetch latest boosted tokens. Please check the logs for more details.",
                },
                []
            );
        }
    },
    examples: [],
    similes: [
        "GET_LATEST_BOOSTED_TOKENS",
        "FETCH_NEW_BOOSTED_TOKENS",
        "CHECK_RECENT_BOOSTED_TOKENS",
        "LIST_NEW_BOOSTED_TOKENS",
    ],
};

export const getTopBoostedTokensAction: Action = {
    name: "GET_TOP_BOOSTED_TOKENS",
    description: "Get tokens with most active boosts from DexScreener API",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        elizaLogger.log("Validating runtime for GET_TOP_BOOSTED_TOKENS...");
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Starting GET_TOP_BOOSTED_TOKENS handler...");

        try {
            const response = await fetch(
                "https://api.dexscreener.com/token-boosts/top/v1",
                {
                    method: "GET",
                    headers: {
                        accept: "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tokens: TokenProfile[] = await response.json();

            const formattedOutput = tokens
                .map((token) => {
                    const description =
                        token.description || "No description available";
                    return `Chain: ${token.chainId}\nToken Address: ${token.tokenAddress}\nURL: ${token.url}\nDescription: ${description}\n\n`;
                })
                .join("");

            state = (await runtime.composeState(
                await createTokenMemory(runtime, state, formattedOutput)
            )) as State;

            callback(
                {
                    text: formattedOutput,
                },
                []
            );
        } catch (error) {
            elizaLogger.error("Error fetching top boosted tokens:", error);
            callback(
                {
                    text: "Failed to fetch top boosted tokens. Please check the logs for more details.",
                },
                []
            );
        }
    },
    examples: [],
    similes: [
        "GET_TOP_BOOSTED_TOKENS",
        "FETCH_MOST_BOOSTED_TOKENS",
        "CHECK_HIGHEST_BOOSTED_TOKENS",
        "LIST_TOP_BOOSTED_TOKENS",
    ],
};
