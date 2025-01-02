import {
    type Action,
    ActionExample,
    composeContext,
    Content,
    elizaLogger,
    generateObjectDeprecated,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@elizaos/core";

import { connectWallet, estimateGas } from "../providers/wallet";
import { StdFee } from "@cosmjs/stargate";

/**
 * Example interface for user-specified Cosmos transfer details.
 * You can add fields like chainName, memo, etc., as needed.
 */
export interface TransferCosmosContent extends Content {
    tokenDenom: string; // e.g. "uosmo"
    recipient?: string; // e.g. "cosmos1abc..."
    amount: string | number; // e.g. "1000" in minimal units or a float
    memo?: string; // optional memo
}

/**
 * Quick type-guard to confirm user content is valid.
 */
export function isTransferCosmosContent(
    content: TransferCosmosContent
): content is TransferCosmosContent {
    // Basic type checks
    const validTypes =
        typeof content.tokenDenom === "string" &&
        (typeof content.amount === "string" ||
            typeof content.amount === "number");

    if (!validTypes) {
        return false;
    }

    // If recipient is provided, check it starts with "cosmos1" or "osmo1" etc.
    // (Adjust this logic for your chain’s prefix)
    if (content.recipient) {
        if (
            !(
                content.recipient.startsWith("cosmos1") ||
                content.recipient.startsWith("osmo1")
            )
        ) {
            return false;
        }
    }

    // If memo is present, just ensure it’s a string
    if (content.memo && typeof content.memo !== "string") {
        return false;
    }

    return true;
}

/**
 * Prompt template for Eliza to parse the token transfer fields from user messages.
 * Adjust to fit your chain and your known tokens (like OSMO, ATOM, etc.).
 */
const transferTemplate = `Respond with a JSON markdown block containing only these fields:
  - tokenDenom
  - recipient
  - amount
  - memo (optional)

  Use null if a field is not determinable.

  Example response:
  \`\`\`json
  {
    "tokenDenom": "uosmo",
    "recipient": "osmo1xyzabc...",
    "amount": "1000",
    "memo": "payment for services"
  }
  \`\`\`

  {{recentMessages}}

  Given the conversation above, extract the following information for a Cosmos token transfer:
  - The token denom or symbol (e.g. uosmo)
  - The recipient address (if specified)
  - The amount
  - An optional memo
  `;

/**
 * Action to parse user’s request to send a token on Cosmos, then sign & broadcast.
 */
export default {
    name: "COSMOS_SEND_TOKEN",
    // synonyms or “similes” that might trigger this action
    similes: [
        "TRANSFER_TOKEN_ON_COSMOS",
        "TRANSFER_TOKENS_ON_COSMOS",
        "SEND_TOKENS_ON_COSMOS",
        "PAY_ON_COSMOS",
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        // If you have chain config checks or environment validation, do them here
        return true;
    },
    description:
        "Use this action if the user requests sending a token on Cosmos. Extracts token denom, recipient, and amount from the conversation, then executes.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting COSMOS_SEND_TOKEN handler...");

        // Ensure we have a state with recent user messages
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        // Compose a context with the transfer template
        const transferContext = composeContext({
            state,
            template: transferTemplate,
        });

        // Ask the LLM to produce JSON with the relevant fields
        const content = await generateObjectDeprecated({
            runtime,
            context: transferContext,
            modelClass: ModelClass.MEDIUM,
        });

        elizaLogger.debug("Cosmos transfer parsed content:", content);

        // Validate the parsed content
        if (!isTransferCosmosContent(content)) {
            elizaLogger.error(
                "Invalid transfer content for COSMOS_SEND_TOKEN."
            );
            if (callback) {
                callback({
                    text: "Not enough information to transfer tokens on Cosmos. Need 'tokenDenom', 'recipient', 'amount'.",
                    content: { error: "Invalid cosmos transfer content" },
                });
            }
            return false;
        }

        // We have valid transfer content
        const { tokenDenom, recipient, amount, memo } = content;

        if (!recipient) {
            // If user didn't specify a valid recipient, we can't proceed
            elizaLogger.error("No valid recipient provided.");
            if (callback) {
                callback({
                    text: "No valid recipient for Cosmos transfer. Please provide an address.",
                    content: { error: "Missing recipient" },
                });
            }
            return false;
        }

        if (!amount) {
            elizaLogger.error("No valid amount provided.");
            if (callback) {
                callback({
                    text: "No valid amount for Cosmos transfer. Please provide a numeric value.",
                    content: { error: "Missing amount" },
                });
            }
            return false;
        }

        // Convert string or number to string minimal units
        // You might need to handle decimals for a real chain
        const sendAmount = String(amount);

        try {
            // 1) Connect to the chain
            const { stargateClient, signerAddress, chainInfo } =
                await connectWallet(runtime);

            // 2) Estimate Gas
            const cosmosBankMsgForFees = {
                typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                value: {
                    fromAddress: signerAddress,
                    toAddress: recipient,
                    amount: [{ denom: tokenDenom, amount: sendAmount }],
                },
            };

            const newMemo = memo + " - sent via Vitwit's Eliza Cosmos plugin";

            const fee: StdFee = await estimateGas(
                [cosmosBankMsgForFees],
                newMemo,
                stargateClient,
                signerAddress,
                chainInfo
            );

            // 3) Perform the send
            elizaLogger.log(
                `Transferring ${sendAmount} ${tokenDenom} from ${signerAddress} to ${recipient} ...`
            );

            const result = await stargateClient.sendTokens(
                signerAddress,
                recipient,
                [{ denom: tokenDenom, amount: sendAmount }],
                fee,
                newMemo
            );

            // TODO : Handle `Invalid string. Length must be a multiple of 4` error
            // Try to replace stargateClient with SigningCosmWasmClient

            if (result.code !== 0) {
                throw new Error(`Broadcast failed with code ${result.code}`);
            }

            const successMsg = `Transfer completed successfully! TxHash: ${result.transactionHash}`;
            elizaLogger.success(successMsg);

            if (callback) {
                callback({
                    text: successMsg,
                    content: {},
                });
            }
            return true;
        } catch (error: any) {
            elizaLogger.error("Error during cosmos token transfer:", error);
            if (callback) {
                callback({
                    text: `Error transferring tokens: ${error.message}`,
                    content: { message: content },
                });
            }
            return false;
        }
    },

    // Example dialogues, similar to the Starknet approach
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 10 OSMO to osmo1xyzabc... with memo 'rent payment'",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Sure, sending 10 OSMO to osmo1xyzabc... now. Let me confirm once done.",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Transfer 50 ATOM to cosmos1abc123...",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Initiating transfer of 50 ATOM to cosmos1abc123.... One moment.",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
