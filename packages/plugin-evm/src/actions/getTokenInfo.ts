import {
    IAgentRuntime,
    Memory,
    State,
    ModelClass,
    composeContext,
    generateObject,
    HandlerCallback
} from "@ai16z/eliza";
import { WalletProvider, evmWalletProvider } from "../providers/wallet";
import { SupportedChain } from "../types";
import { formatUnits } from "viem";
import { erc20Abi } from "../abis/erc20";

interface TokenInfoParams {
    chain: SupportedChain;
    tokenAddress: `0x${string}`;
}

interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    holders?: number;
    priceUSD?: string;
    marketCap?: string;
    verified?: boolean;
}

function isTokenInfoContent(content: any): content is TokenInfoParams {
    return (
        typeof content === "object" &&
        content !== null &&
        typeof content.chain === "string" &&
        ["ethereum", "base", "sepolia"].includes(content.chain) &&
        typeof content.tokenAddress === "string" &&
        content.tokenAddress.startsWith("0x")
    );
}

export const getTokenInfoTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the token info request:
- Chain to check on (must be exactly "ethereum", "base", or "sepolia", no other variations) - REQUIRED
- Token address - REQUIRED

Common token addresses:
- USDC on Ethereum: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
- USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
- USDC on Sepolia: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

Respond with a JSON markdown block containing only the extracted values:

\`\`\`json
{
    "chain": "ethereum" | "base" | "sepolia",
    "tokenAddress": string
}
\`\`\`
`;

// Extended ERC20 ABI to include more token information
const extendedErc20Abi = [
    ...erc20Abi,
    {
        constant: true,
        inputs: [],
        name: "name",
        outputs: [{ name: "", type: "string" }],
        type: "function"
    },
    {
        constant: true,
        inputs: [],
        name: "totalSupply",
        outputs: [{ name: "", type: "uint256" }],
        type: "function"
    }
] as const;

export const getTokenInfoAction = {
    name: "gettokeninfo",
    description: "Get detailed information about an ERC20 token",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory | null,
        state: State | null,
        options: any
    ): Promise<TokenInfo> => {
        try {
            // If skipParsing flag is set, use options directly
            const params = options.skipParsing ? options : await generateObject({
                runtime,
                context: composeContext({ state, template: getTokenInfoTemplate }),
                modelClass: ModelClass.LARGE
            });

            // Skip state composition if skipParsing is true
            if (!options.skipParsing) {
                if (!state) {
                    state = (await runtime.composeState(message)) as State;
                } else {
                    state = await runtime.updateRecentMessageState(state);
                }

                const walletInfo = await evmWalletProvider.get(runtime, message, state);
                state.walletInfo = walletInfo;
            }

            const walletProvider = new WalletProvider(runtime);
            const publicClient = walletProvider.getPublicClient(params.chain);

            // Validate contract first
            const isContract = await publicClient.getBytecode({ address: params.tokenAddress });
            if (!isContract) {
                throw new Error("Address is not a contract");
            }

            // Try to read basic ERC20 info first
            try {
                const symbol = await publicClient.readContract({
                    address: params.tokenAddress,
                    abi: [{
                        inputs: [],
                        name: 'symbol',
                        outputs: [{ type: 'string' }],
                        stateMutability: 'view',
                        type: 'function'
                    }],
                    functionName: 'symbol'
                });

                // If we can read symbol, proceed with full token info
                const [name, decimals, totalSupply] = await Promise.all([
                    publicClient.readContract({
                        address: params.tokenAddress,
                        abi: extendedErc20Abi,
                        functionName: 'name'
                    }),
                    publicClient.readContract({
                        address: params.tokenAddress,
                        abi: extendedErc20Abi,
                        functionName: 'decimals'
                    }),
                    publicClient.readContract({
                        address: params.tokenAddress,
                        abi: extendedErc20Abi,
                        functionName: 'totalSupply'
                    })
                ]);

                // Get price information from CoinGecko (if available)
                let priceInfo = null;
                try {
                    const response = await fetch(
                        `https://api.coingecko.com/api/v3/simple/token_price/${params.chain}?contract_addresses=${params.tokenAddress}&vs_currencies=usd&include_market_cap=true`
                    );
                    priceInfo = await response.json();
                } catch (error) {
                    console.warn("Failed to fetch price info:", error);
                }

                const tokenInfo: TokenInfo = {
                    address: params.tokenAddress,
                    name: name as string,
                    symbol: symbol as string,
                    decimals: decimals as number,
                    totalSupply: formatUnits(totalSupply as bigint, decimals as number),
                    priceUSD: priceInfo?.[params.tokenAddress.toLowerCase()]?.usd?.toString(),
                    marketCap: priceInfo?.[params.tokenAddress.toLowerCase()]?.usd_market_cap?.toString()
                };

                // Try to get contract verification status from Etherscan/block explorer
                if (params.chain === "ethereum") {
                    try {
                        const etherscanKey = runtime.getSetting("ETHERSCAN_API_KEY");
                        if (etherscanKey) {
                            const response = await fetch(
                                `https://api.etherscan.io/api?module=contract&action=getabi&address=${params.tokenAddress}&apikey=${etherscanKey}`
                            );
                            const data = await response.json();
                            tokenInfo.verified = data.status === "1";
                        }
                    } catch (error) {
                        console.warn("Failed to check verification status:", error);
                    }
                }

                return tokenInfo;
            } catch (error) {
                throw new Error("Not a valid ERC20 token contract");
            }
        } catch (error) {
            console.error("Error in getTokenInfo handler:", error);
            throw error;
        }
    },
    template: getTokenInfoTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Get info about USDC on Ethereum",
                    action: "GET_TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "What are the details of the USDC token on Base?",
                    action: "GET_TOKEN_INFO",
                },
            },
        ],
    ],
    similes: ["GET_TOKEN_INFO", "TOKEN_INFO", "TOKEN_DETAILS", "ERC20_INFO"],
};