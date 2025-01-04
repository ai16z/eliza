import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
import { BirdeyeProvider } from "../birdeye";
import { extractChain, formatPortfolio } from "../utils";

/**
 * Agent portfolio data provider that queries Birdeye API for the agent's wallet address.
 * When a wallet address is set, this provider fetches portfolio data to give the agent
 * context about the agent's holdings when responding to queries.
 *
 * The provider:
 * - Validates the agent's wallet address
 * - Fetches current portfolio data from Birdeye including token balances and metadata
 * - Makes this portfolio context available to the agent for responding to user queries
 * about their holdings, token values, etc.
 */
export const agentPortfolioProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string> => {
        try {
            const provider = new BirdeyeProvider(runtime.cacheManager);
            const walletAddr = runtime.getSetting("BIRDEYE_WALLET_ADDR");

            if (!walletAddr) {
                console.warn("No Birdeye wallet was specified");
                return "";
            }

            const chain = extractChain(walletAddr);

            const resp = await provider.fetchWalletPortfolio(
                {
                    wallet: walletAddr,
                },
                {
                    headers: {
                        chain,
                    },
                }
            );

            const portfolioText = formatPortfolio(resp);

            return `This is your wallet address: ${walletAddr}\n\nThis is your portfolio: [${portfolioText}]`;
        } catch (error) {
            console.error("Error fetching token data:", error);
            return "Unable to fetch token information. Please try again later.";
        }
    },
};
