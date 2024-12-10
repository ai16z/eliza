import { createPublicClient, createWalletClient, http } from "viem";
import type { IAgentRuntime } from "@ai16z/eliza";
import type {
    Account,
    Chain,
    HttpTransport,
    PublicClient,
    WalletClient,
} from "viem";
import type { SupportedChain, ChainConfig } from "../types";
import { DEFAULT_CHAIN_CONFIGS } from "./chainConfigs";

export const createChainClients = (
    chain: SupportedChain,
    runtime: IAgentRuntime,
    account: Account
): ChainConfig => {
    const chainConfig = DEFAULT_CHAIN_CONFIGS[chain];
    const transport = http(chainConfig.rpcUrl);

    return {
        chain: chainConfig.chain,
        publicClient: createPublicClient<HttpTransport>({
            chain: chainConfig.chain,
            transport,
        }) as PublicClient<HttpTransport, Chain, Account | undefined>,
        walletClient: createWalletClient<HttpTransport>({
            chain: chainConfig.chain,
            transport,
            account,
        }),
    };
};

export const initializeChainConfigs = (
    runtime: IAgentRuntime,
    account: Account
): Record<SupportedChain, ChainConfig> => {
    return Object.keys(DEFAULT_CHAIN_CONFIGS).reduce(
        (configs, chain) => {
            const supportedChain = chain as SupportedChain;
            configs[supportedChain] = createChainClients(
                supportedChain,
                runtime,
                account
            );
            return configs;
        },
        {} as Record<SupportedChain, ChainConfig>
    );
};
