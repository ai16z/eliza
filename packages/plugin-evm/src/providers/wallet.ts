import {
    type IAgentRuntime,
    type Provider,
    type Memory,
    type State,
    elizaLogger,
} from "@ai16z/eliza";
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
import { mainnet, base, apeChain, curtis } from "viem/chains";
import type { SupportedChain, ChainConfig, ChainMetadata } from "../types";
import { privateKeyToAccount } from "viem/accounts";

export const DEFAULT_CHAIN_CONFIGS: Record<SupportedChain, ChainMetadata> = {
    ethereum: {
        chainId: 1,
        name: "Ethereum",
        chain: mainnet,
        rpcUrl: "https://eth-mainnet-public.unifra.io",
        nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
        },
        blockExplorerUrl: "https://etherscan.io",
    },
    apechain: {
        chainId: 33139,
        name: "ApeChain",
        chain: apeChain,
        rpcUrl: "https://apechain-mainnet.g.alchemy.com/v2/BCpvnI9ysI6XpozBGwcBcuPmwTByJtnM",
        nativeCurrency: {
            name: "ApeCoin",
            symbol: "APE",
            decimals: 18,
        },
        blockExplorerUrl: "https://apescan.io/",
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
    curtis: {
        chainId: 33111,
        name: "Curtis Testnet",
        chain: curtis,
        rpcUrl: "https://apechain-curtis.g.alchemy.com/v2/BCpvnI9ysI6XpozBGwcBcuPmwTByJtnM",
        nativeCurrency: {
            name: "ApeCoin",
            symbol: "APE",
            decimals: 18,
        },
        blockExplorerUrl: "https://explorer.curtis.apechain.com",
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
    private currentChain: SupportedChain = "apechain";
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
            return {
                chain: getChainConfigs(runtime)[chain].chain,
                publicClient: createPublicClient<HttpTransport>({
                    chain: getChainConfigs(runtime)[chain].chain,
                    transport,
                }) as PublicClient<HttpTransport, Chain, Account | undefined>,
                walletClient: createWalletClient<HttpTransport>({
                    chain: getChainConfigs(runtime)[chain].chain,
                    transport,
                    account,
                }),
            };
        };

        this.chainConfigs = {
            ethereum: createClients("ethereum"),
            apechain: createClients("apechain"),
            base: createClients("base"),
            curtis: createClients("curtis"),
        };
    }

    getAddress(): Address {
        return this.address;
    }

    async getWalletBalance(): Promise<string | null> {
        try {
            const client = this.getPublicClient(this.currentChain);
            const walletClient = this.getWalletClient();
            const balance = await client.getBalance({
                address: walletClient.account.address,
            });
            return formatUnits(balance, 18);
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
        const walletClient = this.chainConfigs[this.currentChain].walletClient;
        if (!walletClient) throw new Error("Wallet not connected");

        elizaLogger.log("Switching chain to:", chain);

        try {
            await walletClient.switchChain({
                id: getChainConfigs(runtime)[chain].chainId,
            });
        } catch (error: any) {
            if (error.code === 4902) {
                console.log(
                    "[WalletProvider] Chain not added to wallet (error 4902) - attempting to add chain first"
                );
                await walletClient.addChain({
                    chain: {
                        ...getChainConfigs(runtime)[chain].chain,
                        rpcUrls: {
                            default: {
                                http: [getChainConfigs(runtime)[chain].rpcUrl],
                            },
                            public: {
                                http: [getChainConfigs(runtime)[chain].rpcUrl],
                            },
                        },
                    },
                });
                await walletClient.switchChain({
                    id: getChainConfigs(runtime)[chain].chainId,
                });
            } else {
                throw error;
            }
        }

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
            const currentChain = walletProvider.getCurrentChain();
            const chainConfig = walletProvider.getChainConfig(currentChain);

            return `EVM Wallet Address: ${address}\nBalance: ${balance} ${chainConfig.nativeCurrency.symbol}`;
        } catch (error) {
            console.error("Error in EVM wallet provider:", error);
            return null;
        }
    },
};
