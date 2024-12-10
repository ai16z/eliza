import type { IAgentRuntime, Provider, Memory, State } from "@ai16z/eliza";
import {
    createPublicClient,
    createWalletClient,
    http,
    formatUnits,
    type PublicClient,
    type WalletClient,
    type Chain,
    type HttpTransport,
    type Address,
    Account,
} from "viem";
import { mainnet, base, sepolia } from "viem/chains";
import type { SupportedChain, ChainConfig, ChainMetadata } from "../types";
import { privateKeyToAccount } from "viem/accounts";

export const DEFAULT_CHAIN_CONFIGS: Record<SupportedChain, ChainMetadata> = {
    ethereum: {
        chainId: 1,
        name: "Ethereum",
        chain: mainnet,
        rpcUrl: "https://eth.llamarpc.com",
        nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
        },
        blockExplorerUrl: "https://etherscan.io",
    },
    base: {
        chainId: 8453,
        name: "Base",
        chain: base,
        rpcUrl: "https://base.llamarpc.com",
        nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
        },
        blockExplorerUrl: "https://basescan.org",
    },
    sepolia: {
        chainId: 11155111,
        name: "Sepolia",
        chain: sepolia,
        rpcUrl: "https://rpc.sepolia.org",
        nativeCurrency: {
            name: "Sepolia Ether",
            symbol: "ETH",
            decimals: 18,
        },
        blockExplorerUrl: "https://sepolia.etherscan.io",
    },
} as const;

export const getChainConfigs = (runtime: IAgentRuntime) => {
    return (
        (runtime.character.settings.chains?.evm as ChainConfig[]) ||
        DEFAULT_CHAIN_CONFIGS
    );
};

export class WalletProvider {
    private chainConfigs: Record<SupportedChain, ChainConfig>;
    private currentChain: SupportedChain = "ethereum";
    private address: Address;
    runtime: IAgentRuntime;

    constructor(runtime: IAgentRuntime) {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        if (!privateKey) throw new Error("EVM_PRIVATE_KEY not configured");

        this.runtime = runtime;

        const account = privateKeyToAccount(privateKey as `0x${string}`);
        this.address = account.address;

        const createClients = (chain: SupportedChain): ChainConfig => {
            const transport = http(getChainConfigs(runtime)[chain].rpcUrl);
            const chainConfig = getChainConfigs(runtime)[chain];

            return {
                chain: chainConfig.chain,
                publicClient: createPublicClient<HttpTransport>({
                    chain: chainConfig.chain,
                    transport,
                }) as PublicClient<HttpTransport, Chain, Account | undefined>,
                walletClient: createWalletClient({
                    chain: chainConfig.chain,
                    transport,
                    account,
                }),
            };
        };

        this.chainConfigs = {
            ethereum: createClients("ethereum"),
            base: createClients("base"),
            sepolia: createClients("sepolia"),
        };
    }

    getAddress(): Address {
        return this.address;
    }

    async getWalletBalance(): Promise<bigint | null> {
        try {
            const client = this.getPublicClient(this.currentChain);
            const walletClient = this.getWalletClient();
            const balance = await client.getBalance({
                address: walletClient.account.address,
            });
            return balance;
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }

    async connect(): Promise<`0x${string}`> {
        return this.runtime.getSetting("EVM_PRIVATE_KEY") as `0x${string}`;
    }

    async switchChain(
        runtime: IAgentRuntime,
        chain: SupportedChain
    ): Promise<void> {
        this.currentChain = chain;
    }

    getPublicClient(
        chain: SupportedChain
    ): PublicClient<HttpTransport, Chain, Account | undefined> {
        return this.chainConfigs[chain].publicClient;
    }

    getWalletClient(): WalletClient {
        const walletClient = this.chainConfigs[this.currentChain].walletClient;
        if (!walletClient) throw new Error("Wallet not connected");
        return walletClient;
    }

    getCurrentChain(): SupportedChain {
        return this.currentChain;
    }

    getChainConfig(chain: SupportedChain) {
        return getChainConfigs(this.runtime)[chain];
    }
}

export const evmWalletProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string | null> {
        // Check if the user has an EVM wallet
        if (!runtime.getSetting("EVM_PRIVATE_KEY")) {
            return null;
        }

        try {
            const walletProvider = new WalletProvider(runtime);
            const address = walletProvider.getAddress();
            const balance = await walletProvider.getWalletBalance();
            return `EVM Wallet Address: ${address}\nBalance: ${balance} ETH`;
        } catch (error) {
            console.error("Error in EVM wallet provider:", error);
            return null;
        }
    },
};
