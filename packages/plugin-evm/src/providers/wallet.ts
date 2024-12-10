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
import * as viemChains from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import type { SupportedChain } from "../types";

export class WalletProvider {
    private currentChain: SupportedChain = "mainnet";
    chains: Record<string, Chain> = { mainnet: viemChains.mainnet };
    account: Account;

    constructor(privateKey: `0x${string}`, chains?: Record<string, Chain>) {
        this.setAccount(privateKey);
        this.setChains(chains);

        if (chains && Object.keys(chains).length > 0) {
            this.setCurrentChain(Object.keys(chains)[0] as SupportedChain);
        }
    }

    getAddress(): Address {
        return this.account.address;
    }

    getCurrentChain(): Chain {
        return this.chains[this.currentChain];
    }

    getPublicClient(
        chainName: SupportedChain
    ): PublicClient<HttpTransport, Chain, Account | undefined> {
        const { publicClient } = this.createClients(chainName);
        return publicClient;
    }

    getWalletClient(chainName: SupportedChain): WalletClient {
        const { walletClient } = this.createClients(chainName);
        return walletClient;
    }

    getChainConfigs(chainName: SupportedChain): Chain {
        const chain = viemChains[chainName];

        if (!chain?.id) {
            throw new Error("Invalid chain name");
        }

        return chain;
    }

    async getWalletBalance(): Promise<string | null> {
        try {
            const client = this.getPublicClient(this.currentChain);
            const balance = await client.getBalance({
                address: this.account.address,
            });
            return formatUnits(balance, 18);
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }

    async getWalletBalanceForChain(
        chainName: SupportedChain
    ): Promise<string | null> {
        try {
            const client = this.getPublicClient(chainName);
            const balance = await client.getBalance({
                address: this.account.address,
            });
            return formatUnits(balance, 18);
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }

    addChain(chain: Record<string, Chain>) {
        this.setChains(chain);
    }

    switchChain(chainName: SupportedChain, customRpcUrl?: string) {
        if (!this.chains[chainName]) {
            const chain = WalletProvider.genChainFromName(
                chainName,
                customRpcUrl
            );
            this.addChain({ [chainName]: chain });
        }
        this.setCurrentChain(chainName);
    }

    private setAccount = (pk: `0x${string}`) => {
        this.account = privateKeyToAccount(pk);
    };

    private setChains = (chains?: Record<string, Chain>) => {
        if (!chains) {
            return;
        }
        Object.keys(chains).forEach((chain: string) => {
            this.chains[chain] = chains[chain];
        });
    };

    private setCurrentChain = (chain: SupportedChain) => {
        this.currentChain = chain;
    };

    private createHttpTransport = (chainName: SupportedChain) => {
        const chain = this.chains[chainName];

        if (chain.rpcUrls.custom) {
            return http(chain.rpcUrls.custom.http[0]);
        }
        return http(chain.rpcUrls.default.http[0]);
    };

    private createClients = (chain: SupportedChain) => {
        const transport = this.createHttpTransport(chain);

        return {
            chain: this.chains[chain],
            publicClient: createPublicClient({
                chain: this.chains[chain],
                transport,
            }),
            walletClient: createWalletClient<HttpTransport>({
                chain: this.chains[chain],
                transport,
                account: this.account,
            }),
        };
    };

    static genChainFromName(
        chainName: string,
        customRpcUrl?: string | null
    ): Chain {
        const baseChain = viemChains[chainName];

        if (!baseChain?.id) {
            throw new Error("Invalid chain name");
        }

        const viemChain: Chain = customRpcUrl
            ? {
                  ...baseChain,
                  rpcUrls: {
                      ...baseChain.rpcUrls,
                      custom: {
                          http: [customRpcUrl],
                      },
                  },
              }
            : baseChain;

        return viemChain;
    }
}

const genChainsFromRuntime = (
    runtime: IAgentRuntime
): Record<string, Chain> => {
    const chainNames =
        (runtime.character.settings.chains?.evm as SupportedChain[]) || [];
    const chains = {};

    chainNames.forEach((chainName) => {
        const rpcUrl = runtime.getSetting(
            "ETHEREUM_PROVIDER_" + chainName.toUpperCase()
        );
        const chain = WalletProvider.genChainFromName(chainName, rpcUrl);
        chains[chainName] = chain;
    });

    const mainnet_rpcurl = runtime.getSetting("EVM_PROVIDER_URL");
    if (mainnet_rpcurl) {
        const chain = WalletProvider.genChainFromName(
            "mainnet",
            mainnet_rpcurl
        );
        chains["mainnet"] = chain;
    }

    return chains;
};

export const evmWalletProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string | null> {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        if (!privateKey) {
            return null;
        }

        const chains = genChainsFromRuntime(runtime);

        try {
            const walletProvider = new WalletProvider(
                privateKey as `0x${string}`,
                chains
            );
            const address = walletProvider.getAddress();
            const balance = await walletProvider.getWalletBalance();
            const chain = walletProvider.getCurrentChain();
            return `EVM Wallet Address: ${address}\nBalance: ${balance} ETH\nChain ID: ${chain.id}, Name: ${chain.name}, Native Currency: ${chain.nativeCurrency}`;
        } catch (error) {
            console.error("Error in EVM wallet provider:", error);
            return null;
        }
    },
};
