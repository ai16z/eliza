import {
    Address,
    ByteArray,
    createWalletClient,
    http,
    HttpTransport,
    parseEther,
    type Hex,
} from "viem";
import { DEFAULT_CHAIN_CONFIGS, WalletProvider } from "../providers/wallet";
import type { SupportedChain, Transaction, TransferParams } from "../types";
import { transferTemplate } from "../templates";
import {
    composeContext,
    elizaLogger,
    generateMessageResponse,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@ai16z/eliza";
import { privateKeyToAccount } from "viem/accounts";

export { transferTemplate };
export class TransferAction {
    constructor(private walletProvider: WalletProvider) {}

    async transfer(
        runtime: IAgentRuntime,
        params: TransferParams
    ): Promise<Transaction> {
        elizaLogger.log("Transfer action called with params:", params);

        const walletClient = this.walletProvider.getWalletClient();
        const [fromAddress] = await walletClient.getAddresses();

        elizaLogger.log("Current chain:", walletClient);

        try {
            const hash = await walletClient.sendTransaction({
                account: walletClient.account,
                to: params.toAddress,
                value: parseEther(params.amount),
                data: params.data as Hex,
                kzg: {
                    blobToKzgCommitment: function (blob: ByteArray): ByteArray {
                        throw new Error("Function not implemented.");
                    },
                    computeBlobKzgProof: function (
                        blob: ByteArray,
                        commitment: ByteArray
                    ): ByteArray {
                        throw new Error("Function not implemented.");
                    },
                },
                chain: walletClient.chain,
            });

            return {
                hash,
                from: fromAddress,
                to: params.toAddress,
                value: parseEther(params.amount),
                data: params.data as Hex,
            };
        } catch (error) {
            throw new Error(`Transfer failed: ${error.message}`);
        }
    }
}

export const transferAction = {
    name: "transfer",
    description: "Transfer tokens between addresses on the same chain",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any
    ) => {
        const walletProvider = new WalletProvider(runtime);
        const action = new TransferAction(walletProvider);

        const context = composeContext({
            state,
            template: transferTemplate,
        });

        const response = await generateMessageResponse({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        elizaLogger.log("Transfer response:", response);

        const { fromChain, amount, toAddress } = response;

        const transferParams: TransferParams = {
            fromChain: fromChain as SupportedChain,
            amount: amount as string,
            toAddress: toAddress as Address,
            data: "0x",
        };

        return action.transfer(runtime, transferParams);
    },
    template: transferTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "assistant",
                content: {
                    text: "I'll help you transfer 1 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "SEND_TOKENS",
                },
            },
            {
                user: "user",
                content: {
                    text: "Transfer 1 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "SEND_TOKENS",
                },
            },
        ],
    ],
    similes: ["SEND_TOKENS", "TOKEN_TRANSFER", "MOVE_TOKENS"],
};
