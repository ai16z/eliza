import type { Action } from "@elizaos/core";
import {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    elizaLogger,
    composeContext,
    generateObject,
} from "@elizaos/core";
import { validateCronosZkevmConfig } from "../enviroment";

import {
    Address,
    createWalletClient,
    erc20Abi,
    http,
    parseEther,
    isAddress,
    parseUnits,
} from "viem";
import { cronoszkEVM } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { eip712WalletActions } from "viem/zksync";
import { z } from "zod";

const TransferSchema = z.object({
    tokenAddress: z.string(),
    recipient: z.string(),
    amount: z.string(),
});

export interface TransferContent extends Content {
    tokenAddress: string;
    recipient: string;
    amount: string | number;
}

export function isTransferContent(
    content: TransferContent
): content is TransferContent {
    const { tokenAddress, recipient, amount } = content;

    // Validate types
    const areTypesValid =
        typeof tokenAddress === "string" &&
        typeof recipient === "string" &&
        (typeof amount === "string" || typeof amount === "number");

    if (!areTypesValid) {
        return false;
    }

    // Validate addresses
    return [tokenAddress, recipient].every((address) =>
        isAddress(address, { strict: false })
    );
}

const transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Here are several frequently used addresses. Use these for the corresponding tokens:
- ZKCRO/zkCRO: 0x000000000000000000000000000000000000800A
- USDC/usdc: 0xaa5b845f8c9c047779bedf64829601d8b264076c
- ETH/eth: 0x898b3560affd6d955b1574d87ee09e46669c60ea

Example response:
\`\`\`json
{
    "tokenAddress": "0xaa5b845f8c9c047779bedf64829601d8b264076c",
    "recipient": "0xCCa8009f5e09F8C5dB63cb0031052F9CB635Af62",
    "amount": "1000"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- Token contract address
- Recipient wallet address
- Amount to transfer

Respond with a JSON markdown block containing only the extracted values.`;

const ZKCRO_ADDRESS = "0x000000000000000000000000000000000000800A";
const ERC20_OVERRIDE_INFO = {
    "0xe4c7fbb0a626ed208021ccaba6be1566905e2dfc": {
        name: "USDC",
        decimals: 6,
    },
};

export default {
    name: "SEND_TOKEN",
    similes: [
        "TRANSFER_TOKEN_ON_CRONOSZKEVM",
        "TRANSFER_TOKENS_ON_CRONOSZK",
        "SEND_TOKENS_ON_CRONOSZKEVM",
        "SEND_TOKENS_ON_CRONOSZK",
        "SEND_ETH_ON_CRONOSZKEVM",
        "SEND_ETH_ON_CRONOSZK",
        "PAY_ON_CRONOSZKEVM",
        "PAY_ON_CRONOSZK",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        await validateCronosZkevmConfig(runtime);
        return true;
    },
    description: "Transfer tokens from the agent's wallet to another address",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting Cronos zkEVM SEND_TOKEN handler...");

        // Initialize or update state
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        // Compose transfer context
        const transferContext = composeContext({
            state,
            template: transferTemplate,
        });

        // Generate transfer content
        const content = (
            await generateObject({
                runtime,
                context: transferContext,
                modelClass: ModelClass.SMALL,
                schema: TransferSchema,
            })
        ).object as unknown as TransferContent;

        // Validate transfer content
        if (!isTransferContent(content)) {
            console.error("Invalid content for TRANSFER_TOKEN action.");
            if (callback) {
                callback({
                    text: "Unable to process transfer request. Invalid content provided.",
                    content: { error: "Invalid transfer content" },
                });
            }
            return false;
        }

        try {
            const PRIVATE_KEY = runtime.getSetting("CRONOSZKEVM_PRIVATE_KEY");
            const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);

            const walletClient = createWalletClient({
                chain: cronoszkEVM,
                transport: http(),
            }).extend(eip712WalletActions());

            let hash;

            // Check if the token is native
            if (
                content.tokenAddress.toLowerCase() !==
                ZKCRO_ADDRESS.toLowerCase()
            ) {
                // Convert amount to proper token decimals
                const tokenInfo =
                    ERC20_OVERRIDE_INFO[content.tokenAddress.toLowerCase()];
                const decimals = tokenInfo?.decimals ?? 18; // Default to 18 decimals if not specified
                const tokenAmount = parseUnits(
                    content.amount.toString(),
                    decimals
                );

                // Execute ERC20 transfer
                hash = await walletClient.writeContract({
                    account,
                    chain: cronoszkEVM,
                    address: content.tokenAddress as Address,
                    abi: erc20Abi,
                    functionName: "transfer",
                    args: [content.recipient as Address, tokenAmount],
                });
            } else {
                hash = await walletClient.sendTransaction({
                    account: account,
                    chain: cronoszkEVM,
                    to: content.recipient as Address,
                    value: parseEther(content.amount.toString()),
                    kzg: undefined,
                });
            }

            elizaLogger.success(
                "Transfer completed successfully! Transaction hash: " + hash
            );
            if (callback) {
                callback({
                    text:
                        "Transfer completed successfully! Transaction hash: " +
                        hash,
                    content: {},
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during token transfer:", error);
            if (callback) {
                callback({
                    text: `Error transferring tokens: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 100 USDC to 0xCCa8009f5e09F8C5dB63cb0031052F9CB635Af62",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Sure, I'll send 100 USDC to that address now.",
                    action: "SEND_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Successfully sent 100 USDC to 0xCCa8009f5e09F8C5dB63cb0031052F9CB635Af62\nTransaction: 0x4fed598033f0added272c3ddefd4d83a521634a738474400b27378db462a76ec",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Please send 100 ZKCRO tokens to 0xbD8679cf79137042214fA4239b02F4022208EE82",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Of course. Sending 100 ZKCRO to that address now.",
                    action: "SEND_TOKEN",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Successfully sent 100 ZKCRO to 0xbD8679cf79137042214fA4239b02F4022208EE82\nTransaction: 0x0b9f23e69ea91ba98926744472717960cc7018d35bc3165bdba6ae41670da0f0",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
