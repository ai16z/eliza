import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import { createClient } from "genlayer-js";
import { simulator } from "genlayer-js/chains";
import { GenLayerClient, SimulatorChain } from "genlayer-js/types";
import { privateKeyToAccount } from "viem/accounts";

import { Account } from "viem";

function instantiateClient(account?: Account, rpcUrl?: string) {
    const rpcUrlToUse = rpcUrl ?? "https://studio.genlayer.com:8443/api";
    return createClient({
        chain: {
            ...simulator,
            rpcUrls: {
                default: {
                    http: [rpcUrlToUse],
                },
            },
        },
        account,
    });
}

export class ClientProvider {
    readonly client: GenLayerClient<SimulatorChain>;
    readonly account: Account;

    constructor(runtime: IAgentRuntime) {
        const privateKey = runtime.getSetting(
            "GENLAYER_PRIVATE_KEY"
        ) as `0x${string}`;
        if (!privateKey) throw new Error("GENLAYER_PRIVATE_KEY not configured");

        const rpcUrl = runtime.getSetting("GENLAYER_RPC_URL");
        this.account = privateKeyToAccount(privateKey);

        this.client = instantiateClient(this.account, rpcUrl ?? undefined);
    }
}

export const clientProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> => {
        try {
            const provider = new ClientProvider(runtime);

            return `GenLayer Account Address: ${provider.account.address}`;
        } catch (error) {
            console.error("Error in client provider:", error);
            return null;
        }
    },
};
