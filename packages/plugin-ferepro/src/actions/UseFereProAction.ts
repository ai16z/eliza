import {
    elizaLogger,
    ActionExample,
    Memory,
    State,
    IAgentRuntime,
    ModelProviderName,
    type Action,
    HandlerCallback,
} from "@elizaos/core";

export default {
    name: "FERE_PRO",
    similes: [
        "BLOCKCHAIN_INFO",
        "CRYPTO_INFO",
        "DEFI_DETAILS",
        "NFT_DETAILS",
        "WEB3_INSIGHTS",
        "BLOCKCHAIN_RESEARCH",
        "CRYPTO_RESEARCH",
        "FIND_BLOCKCHAIN_INFO",
        "GET_CRYPTO_DATA",
    ],
    description:
        "Answer questions related to blockchain technology, cryptocurrencies, DeFi, NFTs, and Web3.",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        if (runtime.modelProvider === 'fereai' as ModelProviderName) {
            return true
        } else {
            return false
        }
    },
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {

        elizaLogger.log("Fere Pro prompt received:", _message.content.text);
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Tell me Solana memecoins which are greater than $100 million marketcap",
                    action: "FERE_PRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Tell me Base memecoins which are greater than $100 million marketcap",
                    action: "FERE_PRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Please tell me which ones would be a good buy in the current environment",
                    action: "FERE_PRO",
                    stream: true
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Compare the performance and social sentiment of the top 5 memecoins on Solana vs. Base. Highlight any significant differences and potential reasons",
                    action: "FERE_PRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Analyze the risk-adjusted returns of the top 10 trending tokens. Provide insights on which tokens offer the best risk-to-reward ratio",
                    action: "FERE_PRO",
                    stream: true,
                    debug: true,
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Using historical data and current trends, predict the potential performance of the top 5 AI tokens over the next week. Provide the rationale behind each prediction",
                    action: "FERE_PRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Top KOLs for DEGEN on Base",
                    action: "FERE_PRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Give me a detailed analysis of $degen token",
                    action: "FERE_PRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Give me a summary of the latest crypto news today",
                    action: "FERE_PRO",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
