import type { IAgentRuntime, Memory, State } from "@ai16z/eliza";
import {
    createConfig,
    executeRoute,
    ExtendedChain,
    getRoutes,
} from "@lifi/sdk";
import { WalletProvider } from "../providers/wallet";
import { bridgeTemplate } from "../templates";
import type { BridgeParams, Transaction } from "../types";

export { bridgeTemplate };

export class BridgeAction {
    private config;

    constructor(private walletProvider: WalletProvider) {
        this.config = createConfig({
            integrator: "eliza",
            chains: Object.values(this.walletProvider.chains).map((config) => ({
                id: config.id,
                name: config.name,
                key: config.name.toLowerCase(),
                chainType: "EVM",
                nativeToken: {
                    ...config.nativeCurrency,
                    chainId: config.id,
                    address: "0x0000000000000000000000000000000000000000",
                    coinKey: config.nativeCurrency.symbol,
                },
                metamask: {
                    chainId: `0x${config.id.toString(16)}`,
                    chainName: config.name,
                    nativeCurrency: config.nativeCurrency,
                    rpcUrls: [config.rpcUrls.default.http[0]],
                    blockExplorerUrls: [config.blockExplorers.default.url],
                },
                diamondAddress: "0x0000000000000000000000000000000000000000",
                coin: config.nativeCurrency.symbol,
                mainnet: true,
            })) as ExtendedChain[],
        });
    }

    async bridge(params: BridgeParams): Promise<Transaction> {
        const walletClient = this.walletProvider.getWalletClient(
            params.fromChain
        );
        const [fromAddress] = await walletClient.getAddresses();

        const routes = await getRoutes({
            fromChainId: this.walletProvider.getChainConfigs(params.fromChain)
                .id,
            toChainId: this.walletProvider.getChainConfigs(params.toChain).id,
            fromTokenAddress: params.fromToken,
            toTokenAddress: params.toToken,
            fromAmount: params.amount,
            fromAddress: fromAddress,
            toAddress: params.toAddress || fromAddress,
        });

        if (!routes.routes.length) throw new Error("No routes found");

        const execution = await executeRoute(routes.routes[0], this.config);
        const process = execution.steps[0]?.execution?.process[0];

        if (!process?.status || process.status === "FAILED") {
            throw new Error("Transaction failed");
        }

        return {
            hash: process.txHash as `0x${string}`,
            from: fromAddress,
            to: routes.routes[0].steps[0].estimate
                .approvalAddress as `0x${string}`,
            value: BigInt(params.amount),
            chainId: this.walletProvider.getChainConfigs(params.fromChain).id,
        };
    }
}

export const bridgeAction = {
    name: "bridge",
    description: "Bridge tokens between different chains",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any
    ) => {
        const privateKey = runtime.getSetting(
            "EVM_PRIVATE_KEY"
        ) as `0x${string}`;
        const walletProvider = new WalletProvider(privateKey);
        const action = new BridgeAction(walletProvider);
        return action.bridge(options);
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
    ],
    similes: ["CROSS_CHAIN_TRANSFER", "CHAIN_BRIDGE", "MOVE_CROSS_CHAIN"],
}; // TODO: add more examples / similies
