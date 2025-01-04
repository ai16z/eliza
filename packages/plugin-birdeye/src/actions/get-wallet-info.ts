import {
    Action,
    ActionExample,
    composeContext,
    elizaLogger,
    generateText,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import { BirdeyeProvider } from "../birdeye";
import { extractAddressesFromString } from "../utils";

const extractWalletAddressTemplate = `Given the recent message below:
{{recentMessages}}
Extract all wallet addresses mentioned in the message. Look for:
- Ethereum-style addresses (0x...)
- Solana-style addresses (base58 encoded)
- Any addresses prefixed with "wallet" or "address"

For each address found, determine the chain (ethereum, solana) based on format.
Respond with a JSON array of objects containing the address and chain, no extra description needed.
Example:
Message: "Check wallet 0x742d35Cc6634C0532925a3b844Bc454e4438f44e and 5oGQxNmx4VrNHrq3mkZvpBzwTjnHHzxwpP1kPaS6cNyu"
Response: [
    {"address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "chain": "ethereum"},
    {"address": "5oGQxNmx4VrNHrq3mkZvpBzwTjnHHzxwpP1kPaS6cNyu", "chain": "solana"}
]`;

const extractWalletAddressesFromMessage = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
) => {
    const context = composeContext({
        state,
        template: extractWalletAddressTemplate,
    });

    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
    });

    try {
        const regex = new RegExp(/\[(.+)\]/gms);
        const normalized = response && regex.exec(response)?.[0];
        return normalized ? JSON.parse(normalized) : [];
    } catch {
        return [];
    }
};

export const getWalletInfoAction = {
    name: "GET_WALLET_INFO",
    similes: ["CHECK_WALLET", "WALLET_HOLDINGS", "PORTFOLIO_CHECK"],
    description: "Check wallet portfolio and holdings information",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: any
    ) => {
        try {
            const provider = new BirdeyeProvider(runtime.cacheManager);

            // Use the new extraction method
            const addresses = await extractWalletAddressesFromMessage(
                runtime,
                message,
                state
            );

            if (addresses.length === 0) {
                callback?.({
                    text: "No wallet addresses found in the message",
                });
                return true;
            }

            elizaLogger.info(
                `Searching Birdeye provider for ${addresses.length} wallet addresses`
            );

            // Search Birdeye services for wallet portfolio data
            const searchAddressesForTokenMatch = addresses.map((address) =>
                provider.fetchWalletPortfolio(
                    {
                        wallet: address.address,
                    },
                    {
                        headers: {
                            chain: address.chain,
                        },
                    }
                )
            );

            const results = await Promise.all(searchAddressesForTokenMatch);
            const validResults = results.filter((r) => r !== null);

            elizaLogger.info(
                `Found ${validResults.length} valid results for ${addresses.length} addresses`
            );

            if (validResults.length === 0) {
                callback?.({
                    text: "No portfolio data found for the provided addresses",
                });
                return true;
            }

            // Format portfolio data into readable text
            const portfolioText = validResults
                .map((wallet, index) => {
                    const tokens = wallet.data.items.slice(0, 5) || [];
                    const totalValue = tokens.reduce(
                        (sum, token) => sum + (token.valueUsd || 0),
                        0
                    );

                    const header = `*Wallet ${addresses[index].address}*\nTotal Value: $${totalValue.toLocaleString()}\n\nTop Holdings:`;
                    const tokenList = tokens
                        .map(
                            (token) =>
                                `• ${token.symbol}: $${token.valueUsd?.toLocaleString()} (${token.uiAmount?.toFixed(4)} tokens)`
                        )
                        .join("\n");

                    return `${header}\n${tokenList}`;
                })
                .join("\n\n");

            callback?.({ text: portfolioText });
            return true;
        } catch (error) {
            console.error("Error in walletPortfolio handler:", error.message);
            callback?.({ text: `Error: ${error.message}` });
            return false;
        }
    },
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        // Check if the message contains any potential wallet addresses
        const addresses = extractAddressesFromString(message.content.text);
        return addresses.length > 0;
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me the portfolio for 0x1234...5678",
                    action: "WALLET_PORTFOLIO",
                },
            },
            {
                user: "user",
                content: {
                    text: "What tokens does wallet 0xabcd...efgh hold?",
                    action: "CHECK_WALLET",
                },
            },
            {
                user: "user",
                content: {
                    text: "Check holdings in 0x9876...5432",
                    action: "WALLET_HOLDINGS",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
