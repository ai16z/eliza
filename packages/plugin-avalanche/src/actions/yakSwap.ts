import {
    Action,
    ActionExample,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    elizaLogger,
    composeContext,
    generateObject,
    ModelClass,
    Content,
} from "@elizaos/core";
import { approve, getTxReceipt, swap, getQuote } from "../utils";
import { Address } from "viem";
import { validateAvalancheConfig } from "../environment";
import { TOKEN_ADDRESSES, YAK_SWAP_CONFIG } from "../utils/constants";

export interface SwapContent extends Content {
    fromTokenAddress: string;
    toTokenAddress: string;
    recipient?: string;
    amount: string | number;
}

function isSwapContent(
    runtime: IAgentRuntime,
    content: any
): content is SwapContent {
    elizaLogger.debug("Content for swap", content);
    return (
        typeof content.fromTokenAddress === "string" &&
        typeof content.toTokenAddress === "string" &&
        (typeof content.recipient === "string" || !content.recipient) &&
        (typeof content.amount === "string" ||
            typeof content.amount === "number")
    );
}

const transferTemplate = `Respond with a JSON markdown block containing only the extracted values
- Use null for any values that cannot be determined.
- Use address zero for native AVAX transfers.
- If our balance is not enough, use null for the amount.

Example response for a 10 AVAX to USDC swap:
\`\`\`json
{
    "fromTokenAddress": "0x0000000000000000000000000000000000000000",
    "toTokenAddress": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    "recipient": null,
    "amount": "10"
}
\`\`\`

Example response for a 10 WAVAX to USDC swap:
\`\`\`json
{
    "fromTokenAddress": "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    "toTokenAddress": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    "recipient": "0xDcEDF06Fd33E1D7b6eb4b309f779a0e9D3172e44",
    "amount": "10"
}
\`\`\`

Example response to buy WAVAX with 5 USDC:
\`\`\`json
{
    "fromTokenAddress": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    "toTokenAddress": "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    "recipient": "0xDcEDF06Fd33E1D7b6eb4b309f779a0e9D3172e44",
    "amount": "5"
}
\`\`\`

Example response to sell 5 USDC for gmYAK:
\`\`\`json
{
    "fromTokenAddress": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    "toTokenAddress": "0x3A30784c1af928CdFce678eE49370220aA716DC3",
    "recipient": "0xDcEDF06Fd33E1D7b6eb4b309f779a0e9D3172e44",
    "amount": "5"
}
\`\`\`

## Token Addresses

${Object.entries(TOKEN_ADDRESSES)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n")}

## Recent Messages

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- From token address (the token to sell)
- To token address (the token to buy)
- Recipient wallet address (optional)
- Amount to sell

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "SWAP_TOKEN",
    similes: ["TRADE_TOKEN", "BUY_TOKEN", "SELL_TOKEN"],
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        await validateAvalancheConfig(runtime);
        return true;
    },
    description:
        "MUST use this action if the user requests swap a token, the request might be varied, but it will always be a token swap.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting SWAP_TOKEN handler...");

        // Initialize or update state
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        // Compose swap context
        const swapContext = composeContext({
            state,
            template: transferTemplate,
        });

        // Generate swap content
        const content = await generateObject({
            runtime,
            context: swapContext,
            modelClass: ModelClass.SMALL,
        });

        // Validate swap content
        if (!isSwapContent(runtime, content)) {
            elizaLogger.error("Invalid content for SWAP_TOKEN action.");
            callback?.({
                text: "Unable to process swap request. Invalid content provided.",
                content: { error: "Invalid swap content" },
            });
            return false;
        }

        // Log the swap content
        elizaLogger.debug("Swap content:", content);
        const quote = await getQuote(
            runtime,
            content.fromTokenAddress as Address,
            content.toTokenAddress as Address,
            content.amount as number
        );
        // return

        if (
            content.fromTokenAddress ===
            "0x0000000000000000000000000000000000000000"
        ) {
            // todo: swap from native
            elizaLogger.log("Swapping from native AVAX");
        } else if (
            content.toTokenAddress ===
            "0x0000000000000000000000000000000000000000"
        ) {
            // todo: swap to native
            elizaLogger.log("Swapping to native AVAX");
        } else {
            const yakRouterAddress = YAK_SWAP_CONFIG.router as Address;
            const tx = await approve(
                runtime,
                content.fromTokenAddress as Address,
                yakRouterAddress,
                content.amount as number
            );
            callback?.({
                text: "approving token...",
                content: { success: true },
            });

            if (tx) {
                let receipt = await getTxReceipt(runtime, tx);

                if (receipt.status === "success") {
                    callback?.({
                        text: "token approved, swapping...",
                        content: { success: true, txHash: tx },
                    });
                    const swapTx = await swap(runtime, quote);
                    if (swapTx) {
                        receipt = await getTxReceipt(runtime, swapTx);
                        if (receipt.status === "success") {
                            elizaLogger.log("Swap successful");
                            callback?.({
                                text: "swap successful",
                                content: { success: true, txHash: swapTx },
                            });
                        } else {
                            elizaLogger.error("Swap failed");
                            callback?.({
                                text: "swap failed",
                                content: { error: "Swap failed" },
                            });
                        }
                    }
                } else {
                    elizaLogger.error("Approve failed");
                    callback?.({
                        text: "approve failed",
                        content: { error: "Approve failed" },
                    });
                }
            } else {
                callback?.({
                    text: "approve failed",
                    content: { error: "Approve failed" },
                });
            }
        }

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Swap 1 AVAX for USDC" },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Swap 10 USDC for gmYAK" },
            },
        ],
    ] as ActionExample[][],
} as Action;
