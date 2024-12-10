import {
    IAgentRuntime,
    Memory,
    State,
    ModelClass,
    composeContext,
    generateObject,
    HandlerCallback
} from "@ai16z/eliza";
import {
    ChainId,
    createConfig,
    executeRoute,
    ExtendedChain,
    getRoutes,
    type ExecutionOptions,
    type Route,
    type Token,
    type EVMProviderOptions
} from "@lifi/sdk";
import { WalletProvider, evmWalletProvider, getChainConfigs } from "../providers/wallet";
import { swapTemplate } from "../templates";
import type { SwapParams, Transaction, SupportedChain } from "../types";
import { parseEther, formatEther, type WalletClient, type Client } from "viem";
import { EVM } from "@lifi/sdk";

export { swapTemplate };

// Validate the generated content structure
function isSwapContent(content: any): content is SwapParams {
    return (
        typeof content === "object" &&
        content !== null &&
        typeof content.chain === "string" &&
        ["ethereum", "base", "sepolia"].includes(content.chain) &&
        typeof content.fromToken === "string" &&
        typeof content.toToken === "string" &&
        typeof content.amount === "string" &&
        !isNaN(Number(content.amount)) &&
        (content.slippage === null || typeof content.slippage === "number")
    );
}

export class SwapAction {
    private config;

    constructor(private walletProvider: WalletProvider) {
        const evmProviderConfig: EVMProviderOptions = {
            getWalletClient: async () => {
                const client = await this.walletProvider.getWalletClient();
                return client as unknown as Client;
            },
            switchChain: async (chainId: number) => {
                const chainName = Object.entries(getChainConfigs(this.walletProvider.runtime))
                    .find(([_, config]) => config.chainId === chainId)?.[0] as SupportedChain;

                if (!chainName) {
                    throw new Error(`Chain ID ${chainId} not supported`);
                }

                await this.walletProvider.switchChain(
                    this.walletProvider.runtime,
                    chainName
                );
                const client = await this.walletProvider.getWalletClient();
                return client as unknown as Client;
            }
        };

        this.config = createConfig({
            integrator: "eliza",
            chains: Object.values(
                getChainConfigs(this.walletProvider.runtime)
            ).map((config) => ({
                id: config.chainId,
                name: config.name,
                key: config.name.toLowerCase(),
                chainType: "EVM" as const,
                nativeToken: {
                    ...config.nativeCurrency,
                    chainId: config.chainId,
                    address: "0x0000000000000000000000000000000000000000",
                    coinKey: config.nativeCurrency.symbol,
                    priceUSD: "0",
                    logoURI: "",
                    symbol: config.nativeCurrency.symbol,
                    decimals: config.nativeCurrency.decimals,
                    name: config.nativeCurrency.name,
                },
                rpcUrls: {
                    public: { http: [config.rpcUrl] },
                },
                blockExplorerUrls: [config.blockExplorerUrl],
                metamask: {
                    chainId: `0x${config.chainId.toString(16)}`,
                    chainName: config.name,
                    nativeCurrency: config.nativeCurrency,
                    rpcUrls: [config.rpcUrl],
                    blockExplorerUrls: [config.blockExplorerUrl],
                },
                coin: config.nativeCurrency.symbol,
                mainnet: true,
                diamondAddress: "0x0000000000000000000000000000000000000000",
            })) as ExtendedChain[],
            providers: [
                EVM(evmProviderConfig)
            ]
        });
    }

    async swap(params: SwapParams): Promise<Transaction> {
        console.log("Swapping params:", params);

        // Validate required parameters
        if (!params.chain) throw new Error("Chain is required");
        if (!["ethereum", "base", "sepolia"].includes(params.chain)) {
            throw new Error("Chain must be 'ethereum', 'base', or 'sepolia'");
        }
        if (!params.fromToken) throw new Error("Input token is required");
        if (!params.toToken) throw new Error("Output token is required");
        if (!params.amount) throw new Error("Amount is required");
        if (params.slippage && (params.slippage < 1 || params.slippage > 500)) {
            throw new Error("Slippage must be between 1 and 500 basis points");
        }

        const walletClient = this.walletProvider.getWalletClient();
        const [fromAddress] = await walletClient.getAddresses();

        // Switch chain first
        await this.walletProvider.switchChain(this.walletProvider.runtime, params.chain);

        try {
            // Convert ETH amount to Wei
            const amountInWei = parseEther(params.amount);
            console.log("Amount in Wei:", amountInWei.toString());

            // Convert basis points to decimal (e.g., 50 -> 0.005)
            const slippageDecimal = (params.slippage || 50) / 10000;
            console.log("Slippage decimal:", slippageDecimal);

            const routes = await getRoutes({
                fromChainId: getChainConfigs(this.walletProvider.runtime)[
                    params.chain
                ].chainId as ChainId,
                toChainId: getChainConfigs(this.walletProvider.runtime)[
                    params.chain
                ].chainId as ChainId,
                fromTokenAddress: params.fromToken,
                toTokenAddress: params.toToken,
                fromAmount: amountInWei.toString(),
                fromAddress: fromAddress,
                options: {
                    slippage: slippageDecimal, // Use decimal format
                    order: "RECOMMENDED",
                },
            });

            console.log("Routes:", routes);
            if (!routes.routes.length) throw new Error("No routes found");

            // Configure execution options
            const executionOptions: ExecutionOptions = {
                updateRouteHook: (updatedRoute: Route) => {
                    console.log("Route updated:", updatedRoute);
                },
                acceptExchangeRateUpdateHook: async (params: {
                    toToken: Token;
                    oldToAmount: string;
                    newToAmount: string;
                }) => {
                    console.log("Exchange rate update:", {
                        token: params.toToken.symbol,
                        oldAmount: params.oldToAmount,
                        newAmount: params.newToAmount
                    });
                    return true;
                },
                infiniteApproval: false
            };

            const execution = await executeRoute(routes.routes[0], executionOptions);
            console.log("Execution:", execution);
            const process = execution.steps[0]?.execution?.process[0];

            if (!process?.status || process.status === "FAILED") {
                throw new Error("Transaction failed");
            }
            console.log("Process:", process);

            return {
                hash: process.txHash as `0x${string}`,
                from: fromAddress,
                to: routes.routes[0].steps[0].estimate.approvalAddress as `0x${string}`,
                value: amountInWei.toString(),
                data: process.data as `0x${string}`,
                chainId: getChainConfigs(this.walletProvider.runtime)[params.chain].chainId,
            };
        } catch (error) {
            console.error("Swap error:", error);
            throw new Error(`Swap failed: ${error.message}`);
        }
    }
}

export const swapAction = {
    name: "swap",
    description: "Swap tokens on the same chain using aggregated DEX routes via the LiFi SDK",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        try {
            // Compose state if not provided
            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            // Get wallet info for context
            const walletInfo = await evmWalletProvider.get(runtime, message, state);
            state.walletInfo = walletInfo;

            // Generate structured content from natural language
            const swapContext = composeContext({
                state,
                template: swapTemplate,
            });

            const content = await generateObject({
                runtime,
                context: swapContext,
                modelClass: ModelClass.LARGE,
            });

            console.log("Generated content:", content);

            // Validate the generated content
            if (!isSwapContent(content)) {
                throw new Error("Invalid content structure for swap action");
            }

            console.log("Swap handler content:", content);
            const walletProvider = new WalletProvider(runtime);
            const action = new SwapAction(walletProvider);
            const result = await action.swap(content);

            if (callback) {
                callback({
                    text: `Successfully swapped tokens. Transaction hash: ${result.hash}`,
                    content: {
                        transaction: {
                            ...result,
                            value: result.value.toString(),
                        }
                    }
                });
            }

            return true;
        } catch (error) {
            console.error("Error in swap handler:", error);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    template: swapTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Swap 1 ETH for USDC on Ethereum",
                    action: "TOKEN_SWAP",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Exchange 0.5 ETH for USDC on Base",
                    action: "TOKEN_SWAP",
                },
            },
        ],
    ],
    similes: ["TOKEN_SWAP", "EXCHANGE_TOKENS", "TRADE_TOKENS", "SWAP"],
};
