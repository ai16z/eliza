// It should transfer tokens from the agent's wallet to the recipient.

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
import { validateConfig } from "../enviroment";
import { getMnsTarget } from "../utils/mns";
import {
    Web3Provider,
    Account,
    Address,
    MRC20,
    MAINNET_TOKENS,
    parseUnits,
    CHAIN_ID,
    BUILDNET_TOKENS,
} from "@massalabs/massa-web3";
import { validateAddress } from "../utils/address";

export interface TransferContent extends Content {
    tokenAddress: string;
    recipient: string;
    amount: string;
}

export function isTransferContent(content: any): content is TransferContent {
    elizaLogger.log("Starting SEND_TOKEN content", content);

    // Validate types
    const validTypes =
        typeof content.tokenAddress === "string" &&
        typeof content.recipient === "string" &&
        (typeof content.amount === "string" ||
            typeof content.amount === "number");

    if (!validTypes) {
        return false;
    }

    const tokenAddr = validateAddress(content.tokenAddress);
    if (!tokenAddr || tokenAddr.isEOA) {
        return false;
    }

    const recipient: string = content.recipient;
    // Additional checks based on whether recipient or mns is defined
    if (recipient && !recipient.endsWith(".massa")) {
        Address.fromString(content.recipient);
    }

    return true;
}

const transferTemplate = (
    tokens: Record<string, string>
) => `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Smart contrat addresses are prefixed with "AS" and EOA addresses used for recipient are prefixed with "AU".

These are known token addresses, if you get asked about them, use these:
${Object.entries(tokens)
    .map(([name, address]) => `- ${name}: ${address}`)
    .join("\n")}

If a EOA recipient address is provided, use it as is. If a .massa name is provided, use it as recipient.

Example response:
\`\`\`json
{
    "tokenAddress": "AS12LpYyAjYRJfYhyu7fkrS224gMdvFHVEeVWoeHZzMdhis7UZ3Eb",
    "recipient": "mymassaname.massa",
    "amount": "0.001"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- Amount in string format
- Token contract address
- Recipient wallet address or .massa name

If one of the values cannot be determined, ask user for missing information.


Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "SEND_TOKEN",
    similes: [
        "TRANSFER_TOKEN_ON_MASSA",
        "TRANSFER_TOKENS_ON_MASSA",
        "SEND_TOKENS_ON_MASSA",
        "SEND_ETH_ON_MASSA",
        "PAY_ON_MASSA",
    ],
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        await validateConfig(runtime);
        return true;
    },
    description:
        "MUST use this action if the user requests send a token or transfer a token, the request might be varied, but it will always be a token transfer.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting SEND_TOKEN handler...");

        // Initialize or update state
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const secretKey = runtime.getSetting("MASSA_PRIVATE_KEY");
        if (!secretKey) {
            throw new Error("MASSA wallet credentials not configured");
        }
        const account = await Account.fromPrivateKey(secretKey);

        const rpc = runtime.getSetting("MASSA_RPC_URL");
        if (!rpc) {
            throw new Error("MASSA_RPC_URL not configured");
        }
        const provider = Web3Provider.fromRPCUrl(rpc, account);

        const { chainId } = await provider.networkInfos();
        // Compose transfer context
        const transferContext = composeContext({
            state,
            template: transferTemplate(
                chainId === CHAIN_ID.Mainnet ? MAINNET_TOKENS : BUILDNET_TOKENS
            ),
        });

        // Generate transfer content
        const content = await generateObjectDeprecated({
            runtime,
            context: transferContext,
            modelClass: ModelClass.MEDIUM,
        });

        elizaLogger.debug("Transfer content:", content);

        // Validate transfer content
        const isValid = isTransferContent(content);

        if (!isValid) {
            elizaLogger.error("Invalid content for TRANSFER_TOKEN action.");
            if (callback) {
                callback({
                    text: "Not enough information to transfer tokens. Please respond with token address, recipient address or massa name, and amount.",
                    content: { error: "Invalid transfer content" },
                });
            }
            return false;
        }

        let recipientAddress = content.recipient;
        // Validate recipient address
        if (content.recipient.endsWith(".massa")) {
            try {
                recipientAddress = await getMnsTarget(provider, content.recipient.substring(0, content.recipient.length - ".massa".length));
                Address.fromString(recipientAddress);
            } catch (error: any) {
                elizaLogger.error(
                    "Error resolving MNS target:",
                    error?.message
                );
                if (callback) {
                    callback({
                        text: `Error resolving MNS target: ${error?.message}`,
                        content: { error: error },
                    });
                }
                return false;
            }
        }

        try {
            const mrc20Token = new MRC20(provider, content.tokenAddress);
            const decimals = await mrc20Token.decimals();
            const amount = parseUnits(content.amount, decimals);
            const operation = await mrc20Token.transfer(
                recipientAddress,
                amount
            );

            elizaLogger.success(
                "Transferring",
                amount,
                "of",
                content.tokenAddress,
                "to",
                recipientAddress
            );

            await operation.waitSpeculativeExecution();

            elizaLogger.success(
                "Transfer completed successfully! Operation id: " + operation.id
            );
            if (callback) {
                callback({
                    text: `Successfully transferred ${content.amount} tokens to ${content.recipient}\n OperationId: ${operation.id}`,
                    content: {
                        success: true,
                        operationId: operation.id,
                        amount: content.amount,
                        token: content.tokenAddress,
                        recipient: content.recipient,
                    },
                });
            }

            return true;
        } catch (error: any) {
            elizaLogger.error("Error during token transfer:", error?.message);
            if (callback) {
                callback({
                    text: `Error transferring tokens: ${error?.message}`,
                    content: { error: error },
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
                    text: "Send 10 WMAS to AU1bfnCAQAhPT2gAcJkL31fCWJixFFtH7RjRHZsvaThVoeNUckep",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll transfer 10 WMAS to that address right away. Let me process that for you.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Successfully sent 10 WMAS tokens to AU1bfnCAQAhPT2gAcJkL31fCWJixFFtH7RjRHZsvaThVoeNUckep\n Operation id: O12fZa1oNL18s3ZV2PCXVYUmQz2cQrNqKfFaRsyJNFsAcGYxEAKD",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 10 DAI to domain.massa",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll transfer 10 DAI to domain.massa right away. Let me process that for you.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Successfully sent 10 DAI tokens to AU1bfnCAQAhPT2gAcJkL31fCWJixFFtH7RjRHZsvaThVoeNUckep\n Operation id: O12fZa1oNL18s3ZV2PCXVYUmQz2cQrNqKfFaRsyJNFsAcGYxEAKD",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
