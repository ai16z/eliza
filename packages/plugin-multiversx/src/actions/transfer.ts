import {
    elizaLogger,
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    composeContext,
    generateObject,
    type Action,
} from "@ai16z/eliza";
import { WalletProvider } from "../providers/wallet";
import { validateMultiversxConfig } from "../enviroment";

export interface TransferContent extends Content {
    tokenAddress: string;
    amount: string;
    tokenIdentifier?: string;
}

function isTransferContent(
    _runtime: IAgentRuntime,
    content: any
): content is TransferContent {
    console.log("Content for transfer", content);
    return (
        typeof content.tokenAddress === "string" &&
        typeof content.amount === "string"
    );
}

const transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenAddress": "erd12r22hx2q4jjt8e0gukxt5shxqjp9ys5nwdtz0gpds25zf8qwtjdqyzfgzm",
    "amount": "1",
    "tokenIdentifier": "PEPE-3eca7c"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- Token address
- Amount to transfer
- Token identifier

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "SEND_TOKEN",
    similes: [
        "TRANSFER_TOKEN",
        "TRANSFER_TOKENS",
        "SEND_TOKENS",
        "SEND_EGLD",
        "PAY",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        console.log("Validating config for user:", message.userId);
        await validateMultiversxConfig(runtime);
        return true;
    },
    description: "Transfer tokens from the agent wallet to another address",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting SEND_TOKEN handler...");

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
        const content = await generateObject({
            runtime,
            context: transferContext,
            modelClass: ModelClass.SMALL,
        });

        // Validate transfer content
        if (!isTransferContent(runtime, content)) {
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
            const privateKey = runtime.getSetting("MVX_PRIVATE_KEY");
            const network = runtime.getSetting("MVX_NETWORK");

            const walletProvider = new WalletProvider(privateKey, network);

            if (
                content.tokenIdentifier &&
                content.tokenIdentifier.toLowerCase() !== "egld"
            ) {
                await walletProvider.sendESDT({
                    receiverAddress: content.tokenAddress,
                    amount: content.amount,
                    identifier: content.tokenIdentifier,
                });
                return true;
            }

            await walletProvider.sendEGLD({
                receiverAddress: content.tokenAddress,
                amount: content.amount,
            });
            return true;
        } catch (error) {
            console.error("Error during token transfer:", error);
            if (callback) {
                callback({
                    text: `Error transferring tokens: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return "";
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 EGLD to erd12r22hx2q4jjt8e0gukxt5shxqjp9ys5nwdtz0gpds25zf8qwtjdqyzfgzm",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 1 EGLD tokens now...",
                    action: "SEND_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 TST-a8b23d to erd12r22hx2q4jjt8e0gukxt5shxqjp9ys5nwdtz0gpds25zf8qwtjdqyzfgzm",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 1 TST-a8b23d tokens now...",
                    action: "SEND_TOKEN",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
