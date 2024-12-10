import {
    IAgentRuntime,
    Memory,
    State,
    ModelClass,
    composeContext,
    generateObject,
    HandlerCallback
} from "@ai16z/eliza";
import { ByteArray, parseEther, type Hex } from "viem";
import { WalletProvider, evmWalletProvider } from "../providers/wallet";
import { transferTemplate } from "../templates";
import type { Transaction, TransferParams } from "../types";
import { privateKeyToAccount } from "viem/accounts";

export { transferTemplate };

// Validate the generated content structure
function isTransferContent(content: any): content is TransferParams {
    return (
        typeof content === "object" &&
        content !== null &&
        typeof content.fromChain === "string" &&
        ["ethereum", "base", "sepolia"].includes(content.fromChain) &&
        typeof content.amount === "string" &&
        !isNaN(Number(content.amount)) &&
        typeof content.toAddress === "string" &&
        content.toAddress.startsWith("0x") &&
        content.toAddress.length === 42 &&
        (content.data === null || (typeof content.data === "string" && content.data.startsWith("0x")))
    );
}

export class TransferAction {
    constructor(private walletProvider: WalletProvider) {}

    async transfer(
        runtime: IAgentRuntime,
        params: TransferParams
    ): Promise<Transaction> {
        console.log("🚀 Starting transfer with params:", {
            fromChain: params.fromChain,
            toAddress: params.toAddress,
            amount: params.amount,
            hasData: !!params.data
        });

        // Validate required parameters
        if (!params.fromChain || !params.toAddress || !params.amount) {
            console.error("❌ Missing required parameters:", {
                fromChain: params.fromChain,
                toAddress: params.toAddress,
                amount: params.amount
            });
            throw new Error(
                `Transfer failed: Missing required parameters. Need fromChain, toAddress, and amount. Got: ${JSON.stringify(params)}`
            );
        }

        // Validate amount format
        if (isNaN(Number(params.amount)) || Number(params.amount) <= 0) {
            console.error("❌ Invalid amount:", params.amount);
            throw new Error(
                `Transfer failed: Invalid amount. Must be a positive number. Got: ${params.amount}`
            );
        }

        // Validate address format
        if (!params.toAddress.startsWith('0x') || params.toAddress.length !== 42) {
            console.error("❌ Invalid to address:", params.toAddress);
            throw new Error(
                `Transfer failed: Invalid to address. Must be a valid Ethereum address. Got: ${params.toAddress}`
            );
        }

        const walletClient = this.walletProvider.getWalletClient();
        console.log("📱 Got wallet client");

        const [fromAddress] = await walletClient.getAddresses();
        console.log("💳 From address:", fromAddress);

        // Get chain configuration
        const chainConfig = this.walletProvider.getChainConfig(params.fromChain);
        console.log("🔗 Chain config:", {
            name: chainConfig.name,
            chainId: chainConfig.chainId,
            rpcUrl: chainConfig.rpcUrl
        });

        // Switch chain and get updated wallet client
        await this.walletProvider.switchChain(runtime, params.fromChain);
        const updatedWalletClient = this.walletProvider.getWalletClient();
        console.log("🔄 Switched to chain:", params.fromChain);

        try {
            const parsedValue = parseEther(params.amount);
            console.log("💵 Parsed amount (in Wei):", parsedValue.toString());

            // Get balance before transfer
            const balance = await this.walletProvider.getWalletBalance();
            console.log("💰 Current wallet balance (in Wei):", balance?.toString());

            // Prepare the transaction base
            const transactionRequest = {
                to: params.toAddress,
                value: parsedValue,
                data: params.data as Hex ?? "0x",
                chain: chainConfig.chain
            };

            // Estimate gas
            const publicClient = this.walletProvider.getPublicClient(params.fromChain);
            const gasEstimate = await publicClient.estimateGas({
                account: fromAddress,
                ...transactionRequest
            });

            console.log("⛽ Estimated gas:", gasEstimate.toString());

            // Get current gas price
            const gasPrice = await publicClient.getGasPrice();
            console.log("💰 Current gas price:", gasPrice.toString());

            // Get next nonce for the account
            const nonce = await publicClient.getTransactionCount({
                address: fromAddress
            });
            console.log("🔢 Next nonce:", nonce);
            // setup account
            const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
            const account = privateKeyToAccount(privateKey as `0x${string}`);
            // Prepare the complete transaction
            const transaction = {
                to: params.toAddress,
                value: parsedValue,
                data: params.data as Hex ?? "0x",
                gas: gasEstimate,
                gasPrice: gasPrice,
                nonce: nonce,
                chainId: chainConfig.chainId,
                account,
                chain: chainConfig.chain
            };

            console.log("📝 Prepared transaction:", {
                ...transaction,
                chainName: chainConfig.name,
            });

            // Sign the transaction locally with the account
            const signedTx = await updatedWalletClient.signTransaction(transaction);
            console.log("✍️ Signed transaction:", signedTx);

            // Send the raw transaction
            const hash = await publicClient.sendRawTransaction({
                serializedTransaction: signedTx
            });

            console.log("✅ Raw transaction broadcast successfully!", {
                hash,
                from: fromAddress,
                to: params.toAddress,
                value: parsedValue.toString(),
                chain: params.fromChain,
                chainId: chainConfig.chainId
            });

            return {
                hash,
                from: fromAddress,
                to: params.toAddress,
                value: parsedValue.toString(),
                data: params.data as Hex ?? "0x",
            };
        } catch (error) {
            console.error("❌ Transfer failed with error:", {
                message: error.message,
                code: error.code,
                details: error.details,
                stack: error.stack,
                chainId: chainConfig.chainId,
                chainName: chainConfig.name
            });
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
            const transferContext = composeContext({
                state,
                template: transferTemplate,
            });

            const content = await generateObject({
                runtime,
                context: transferContext,
                modelClass: ModelClass.LARGE,
            });

            console.log("Generated content:", content);

            // Validate the generated content
            if (!isTransferContent(content)) {
                throw new Error("Invalid content structure for transfer action");
            }

            const walletProvider = new WalletProvider(runtime);
            const action = new TransferAction(walletProvider);
            const result = await action.transfer(runtime, content);

            if (callback) {
                callback({
                    text: `Successfully transferred ${content.amount} ETH to ${content.toAddress} on ${content.fromChain}. Transaction hash: ${result.hash}`,
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
            console.error("Error in transfer handler:", error);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    template: transferTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Transfer 1 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e on Ethereum",
                    action: "SEND_TOKENS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Send 0.5 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e on Base",
                    action: "SEND_TOKENS",
                },
            },
        ],
    ],
    similes: ["SEND_TOKENS", "TOKEN_TRANSFER", "MOVE_TOKENS"],
};
