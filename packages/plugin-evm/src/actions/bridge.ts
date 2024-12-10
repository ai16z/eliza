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
    EVM,
    EVMProviderOptions,
} from "@lifi/sdk";
import { WalletProvider, evmWalletProvider, getChainConfigs } from "../providers/wallet";
import { bridgeTemplate } from "../templates";
import type { BridgeParams, Transaction, SupportedChain } from "../types";
import { parseEther, formatEther, Client } from "viem";


export { bridgeTemplate };

// Validate the generated content structure
function isBridgeContent(content: any): content is BridgeParams {
    return (
        typeof content === "object" &&
        content !== null &&
        typeof content.fromChain === "string" &&
        typeof content.toChain === "string" &&
        ["ethereum", "base", "sepolia"].includes(content.fromChain) &&
        ["ethereum", "base", "sepolia"].includes(content.toChain) &&
        typeof content.amount === "string" &&
        !isNaN(Number(content.amount)) &&
        (content.toAddress === null ||
         (typeof content.toAddress === "string" &&
          content.toAddress.startsWith("0x") &&
          content.toAddress.length === 42))
    );
}

export class BridgeAction {
    private config;

    constructor(private walletProvider: WalletProvider) {
        // Configure EVM provider for LI.FI SDK
        const evmProviderConfig: EVMProviderOptions = {
            getWalletClient: async () => {
                const client = this.walletProvider.getWalletClient();
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
                const client = this.walletProvider.getWalletClient();
                return client as unknown as Client;
            }
        };

        this.config = createConfig({
            integrator: "eliza",
            chains: Object.values(getChainConfigs(this.walletProvider.runtime))
                .map((config) => ({
                    id: config.chainId,
                    name: config.name,
                    key: config.name.toLowerCase(),
                    chainType: "EVM" as const,
                    nativeToken: {
                        ...config.nativeCurrency,
                        chainId: config.chainId,
                        address: "0x0000000000000000000000000000000000000000",
                        coinKey: config.nativeCurrency.symbol,
                    },
                    metamask: {
                        chainId: `0x${config.chainId.toString(16)}`,
                        chainName: config.name,
                        nativeCurrency: config.nativeCurrency,
                        rpcUrls: [config.rpcUrl],
                        blockExplorerUrls: [config.blockExplorerUrl],
                    },
                    diamondAddress: "0x0000000000000000000000000000000000000000",
                    coin: config.nativeCurrency.symbol,
                    mainnet: true,
                })) as ExtendedChain[],
            providers: [
                EVM(evmProviderConfig)
            ]
        });
    }

    async bridge(
        runtime: IAgentRuntime,
        params: BridgeParams
    ): Promise<Transaction> {
        console.log("🌉 Starting bridge with params:", params);

        // Validate amount
        if (!params.amount || isNaN(Number(params.amount)) || Number(params.amount) <= 0) {
            throw new Error(`Invalid amount: ${params.amount}. Must be a positive number.`);
        }

        // Get current balance
        const walletClient = this.walletProvider.getWalletClient();
        const [fromAddress] = await walletClient.getAddresses();
        console.log("💳 From address:", fromAddress);

        // Switch to source chain and check balance
        await this.walletProvider.switchChain(runtime, params.fromChain);
        const balance = await this.walletProvider.getWalletBalance();
        console.log("💰 Current balance:", balance ? formatEther(balance) : "0");

        // Validate sufficient balance
        const amountInWei = parseEther(params.amount);
        if (!balance || balance < amountInWei) {
            throw new Error(
                `Insufficient balance. Required: ${params.amount} ETH, Available: ${
                    balance ? formatEther(balance) : "0"
                } ETH`
            );
        }

        console.log("💵 Amount to bridge (in Wei):", amountInWei.toString());

        try {
            console.log("🔍 Finding bridge routes...");
            const routes = await getRoutes({
                fromChainId: getChainConfigs(runtime)[params.fromChain].chainId as ChainId,
                toChainId: getChainConfigs(runtime)[params.toChain].chainId as ChainId,
                fromTokenAddress: params.fromToken ?? "0x0000000000000000000000000000000000000000",
                toTokenAddress: params.toToken ?? "0x0000000000000000000000000000000000000000",
                fromAmount: amountInWei.toString(),
                fromAddress: fromAddress,
                toAddress: params.toAddress || fromAddress,
            });

            if (!routes.routes.length) {
                throw new Error("No bridge routes found. The requested bridge path might not be supported.");
            }

            // Log route details
            const selectedRoute = routes.routes[0];
            console.log("🛣️ Selected route:", {
                steps: selectedRoute.steps.length,
                estimatedGas: selectedRoute.gasCostUSD,
                estimatedTime: selectedRoute.steps[0].estimate.executionDuration,
            });

            console.log("✨ Executing bridge transaction...");
            const execution = await executeRoute(selectedRoute, this.config);
            const process = execution.steps[0]?.execution?.process[0];

            if (!process?.status || process.status === "FAILED") {
                throw new Error(`Bridge transaction failed. Status: ${process?.status}, Error: ${process?.error}`);
            }

            console.log("✅ Bridge initiated successfully!", {
                hash: process.txHash,
                from: fromAddress,
                to: selectedRoute.steps[0].estimate.approvalAddress,
                value: params.amount,
                estimatedTime: selectedRoute.steps[0].estimate.executionDuration
            });

            return {
                hash: process.txHash as `0x${string}`,
                from: fromAddress,
                to: selectedRoute.steps[0].estimate.approvalAddress as `0x${string}`,
                value: amountInWei.toString(),
                chainId: getChainConfigs(runtime)[params.fromChain].chainId,
            };
        } catch (error) {
            console.error("❌ Bridge failed with error:", {
                message: error.message,
                code: error.code,
                details: error.details,
                stack: error.stack
            });
            throw new Error(`Bridge failed: ${error.message}`);
        }
    }
}

export const bridgeAction = {
    name: "bridge",
    description: "Bridge tokens between different chains via the LiFi SDK",
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
            const bridgeContext = composeContext({
                state,
                template: bridgeTemplate,
            });

            const content = await generateObject({
                runtime,
                context: bridgeContext,
                modelClass: ModelClass.LARGE,
            });

            console.log("Generated content:", content);

            // Validate the generated content
            if (!isBridgeContent(content)) {
                throw new Error("Invalid content structure for bridge action");
            }

            const walletProvider = new WalletProvider(runtime);
            const action = new BridgeAction(walletProvider);
            const result = await action.bridge(runtime, content);

            if (callback) {
                callback({
                    text: `Successfully bridged ${content.amount} from ${content.fromChain} to ${content.toChain}. Transaction hash: ${result.hash}`,
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
            console.error("Error in bridge handler:", error);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    template: bridgeTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Bridge 1 ETH from Ethereum to Base",
                    action: "CROSS_CHAIN_TRANSFER",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Send 0.5 ETH from Base to Ethereum",
                    action: "CROSS_CHAIN_TRANSFER",
                },
            },
        ],
    ],
    similes: ["CROSS_CHAIN_TRANSFER", "CHAIN_BRIDGE", "MOVE_CROSS_CHAIN"],
};
