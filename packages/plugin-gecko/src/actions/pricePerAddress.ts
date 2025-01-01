import {
    Action,
    elizaLogger,
    IAgentRuntime,
    Memory,
    HandlerCallback,
    State,
    composeContext,
    generateMessageResponse,
    ModelClass,
} from "@elizaos/core";

import type { PriceResponse } from "../types.ts";

// Template for extracting chain and address
export const addressTemplate = `
Extract the blockchain name/chain ID and token address being asked about.
Normalize chain names: ethereum, polygon, solana, base, etc.
Token address should be the full address string.

Respond with a JSON markdown block containing the extracted values:

\`\`\`json
{
"chainId": string,
"tokenAddress": string
}
\`\`\`
`;

function formatMarketCap(marketCap: number): string {
    if (marketCap >= 1_000_000_000) {
        return `${(marketCap / 1_000_000_000).toFixed(1)} billion`;
    } else if (marketCap >= 1_000_000) {
        return `${(marketCap / 1_000_000).toFixed(1)} million`;
    } else if (marketCap >= 1_000) {
        return `${(marketCap / 1_000).toFixed(1)} thousand`;
    }
    return marketCap.toString();
}

function getBaseUrl(runtime: IAgentRuntime): string {
    const isPro =
        (runtime.getSetting("COINGECKO_PRO") ?? process.env.COINGECKO_PRO) ===
        "TRUE";
    return isPro
        ? "https://pro-api.coingecko.com/api/v3"
        : "https://api.coingecko.com/api/v3";
}

export const getPriceByAddressAction: Action = {
    name: "GET_TOKEN_PRICE_BY_ADDRESS",
    description:
        "Get the current USD price for a token using its blockchain address via CoinGecko API.",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        elizaLogger.log("Validating runtime for GET_TOKEN_PRICE_BY_ADDRESS...");
        return !!(
            runtime.getSetting("COINGECKO_API_KEY") ||
            process.env.COINGECKO_API_KEY
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Starting GET_TOKEN_PRICE_BY_ADDRESS handler...");

        try {
            const apiKey =
                runtime.getSetting("COINGECKO_API_KEY") ??
                process.env.COINGECKO_API_KEY;
            const isPro =
                (runtime.getSetting("COINGECKO_PRO") ??
                    process.env.COINGECKO_PRO) === "TRUE";
            const baseUrl = getBaseUrl(runtime);

            // Update the state with current inputs
            if (!state) {
                state = (await runtime.composeState(_message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            // Use state replacements but add message at the top of template
            const context = composeContext({
                state,
                template: `${_message.content.text}\n${addressTemplate}`,
            });

            const result = await generateMessageResponse({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            if (!result) {
                callback(
                    {
                        text: "Invalid chain ID or token address specified.",
                    },
                    []
                );
                return;
            }

            const { chainId: rawChainId, tokenAddress } = result as unknown as {
                chainId: string;
                tokenAddress: string;
            };
            const chainId = rawChainId.toLowerCase();

            // First, fetch token metadata to get the name
            const metadataUrl = `${baseUrl}/coins/${chainId}/contract/${tokenAddress}`;
            const metadataResponse = await fetch(metadataUrl, {
                method: "GET",
                headers: {
                    accept: "application/json",
                    ...(isPro
                        ? { "x-cg-pro-api-key": apiKey }
                        : { "x-cg-demo-api-key": apiKey }),
                },
            });

            let tokenName = null;
            let tokenSymbol = null;

            if (metadataResponse.ok) {
                const metadata = await metadataResponse.json();
                tokenName = metadata.name;
                tokenSymbol = metadata.symbol?.toUpperCase();
            }

            // Format the URL for token price lookup
            const url = `${baseUrl}/simple/token_price/${chainId}?contract_addresses=${tokenAddress}&vs_currencies=usd&include_market_cap=true`;

            const priceResponse = await fetch(url, {
                method: "GET",
                headers: {
                    accept: "application/json",
                    ...(isPro
                        ? { "x-cg-pro-api-key": apiKey }
                        : { "x-cg-demo-api-key": apiKey }),
                },
            });

            if (!priceResponse.ok) {
                throw new Error(`HTTP error! status: ${priceResponse.status}`);
            }

            const priceData: PriceResponse = await priceResponse.json();

            // Try to find the token data regardless of case
            let tokenData =
                priceData[tokenAddress] ||
                priceData[tokenAddress.toLowerCase()] ||
                priceData[tokenAddress.toUpperCase()];

            // If still not found, try to find by searching through keys
            if (!tokenData) {
                const priceDataKeys = Object.keys(priceData);
                const matchingKey = priceDataKeys.find(
                    (key) => key.toLowerCase() === tokenAddress.toLowerCase()
                );
                if (matchingKey) {
                    tokenData = priceData[matchingKey];
                }
            }

            if (!tokenData || !tokenData.usd) {
                callback(
                    {
                        text: `Unable to fetch price for token address ${tokenAddress} on ${chainId}.`,
                    },
                    []
                );
                return;
            }

            const price = tokenData.usd;
            const marketCap = tokenData.usd_market_cap;
            const formattedMarketCap = marketCap
                ? `\nMarket Cap: $${formatMarketCap(marketCap)} USD`
                : "";

            // Prepare token identifier string
            const tokenIdentifier =
                tokenName && tokenSymbol
                    ? `${tokenName} (${tokenSymbol})`
                    : `token`;

            callback(
                {
                    text: `Current price for ${tokenIdentifier}\nAddress: ${tokenAddress}\nChain: ${chainId}\nPrice: ${price.toFixed(6)} USD${formattedMarketCap}`,
                },
                []
            );
        } catch (error) {
            elizaLogger.error("Error during price lookup:", error);
            callback(
                {
                    text: "Failed to fetch token price. Please check the logs for more details.",
                },
                []
            );
        }
    },
    examples: [],
    similes: [
        "GET_TOKEN_PRICE_BY_ADDRESS",
        "FETCH_TOKEN_PRICE_BY_ADDRESS",
        "CHECK_TOKEN_PRICE_BY_ADDRESS",
        "LOOKUP_TOKEN_BY_ADDRESS",
    ],
};
