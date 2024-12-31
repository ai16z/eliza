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
import { approve, deposit, getTxReceipt } from "../utils";
import { Address } from "viem";
import { validateAvalancheConfig } from "../environment";
import { STRATEGY_ADDRESSES, TOKEN_ADDRESSES } from "../utils/constants";

export interface StrategyContent extends Content {
    depositTokenAddress: string;
    strategyAddress: string;
    amount: string | number;
}

function isStrategyContent(
    runtime: IAgentRuntime,
    content: any
): content is StrategyContent {
    elizaLogger.debug("Content for strategy", content);
    return (
        typeof content.depositTokenAddress === "string" &&
        typeof content.strategyAddress === "string" &&
        (typeof content.amount === "string" ||
            typeof content.amount === "number")
    );
}

const strategyTemplate = `Respond with a JSON markdown block containing only the extracted values
- Use null for any values that cannot be determined.
- Use address zero for native AVAX.

Example response for a 100 USDC deposit into a strategy:
\`\`\`json
{
    "depositTokenAddress": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    "strategyAddress": "0xFB692D03BBEA21D8665035779dd3082c2B1622d0",
    "amount": "100"
}
\`\`\`

Example response for a 10 WAVAX deposit into a strategy:
\`\`\`json
{
    "depositTokenAddress": "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    "strategyAddress": "0x8B414448de8B609e96bd63Dcf2A8aDbd5ddf7fdd",
    "amount": "10"
}
\`\`\`

## Token Addresses

${Object.entries(TOKEN_ADDRESSES)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n")}

## Strategy Addresses

${Object.entries(STRATEGY_ADDRESSES)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n")}

## Recent Messages

{{recentMessages}}

Given the recent messages, extract the following information about the requested strategy management:
- Deposit token address (the token to deposit)
- Strategy address (the strategy to deposit into)
- Amount to deposit

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "DEPOSIT_TO_STRATEGY",
    similes: ["DEPOSIT_FOR_YIELD", "DEPOSIT_TOKENS"],
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        await validateAvalancheConfig(runtime);
        return true;
    },
    description:
        "MUST use this action if the user requests to deposit into a yield-earning strategy, the request might be varied, but it will always be a deposit into a strategy.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting DEPOSIT_TO_STRATEGY handler...");

        // Initialize or update state
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        // Compose context
        const strategyContext = composeContext({
            state,
            template: strategyTemplate,
        });

        // Generate content
        const content = await generateObject({
            runtime,
            context: strategyContext,
            modelClass: ModelClass.SMALL,
        });

        // Validate content
        if (!isStrategyContent(runtime, content)) {
            elizaLogger.error(
                "Invalid content for DEPOSIT_TO_STRATEGY action."
            );
            callback?.({
                text: "Unable to process deposit request. Invalid content provided.",
                content: { error: "Invalid deposit content" },
            });
            return false;
        }

        // Log the swap content
        elizaLogger.debug("Deposit content:", content);

        if (
            content.depositTokenAddress ===
            "0x0000000000000000000000000000000000000000"
        ) {
            // todo: deposit from native
            elizaLogger.log("Swapping from native AVAX");
        } else {
            const tx = await approve(
                runtime,
                content.depositTokenAddress as Address,
                content.strategyAddress as Address,
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
                        text: "token approved, depositing...",
                        content: { success: true, txHash: tx },
                    });

                    const depositTx = await deposit(
                        runtime,
                        content.depositTokenAddress as Address,
                        content.strategyAddress as Address,
                        content.amount as number
                    );
                    if (depositTx) {
                        receipt = await getTxReceipt(runtime, depositTx);
                        if (receipt.status === "success") {
                            callback?.({
                                text: "deposit successful",
                                content: { success: true, txHash: depositTx },
                            });
                        } else {
                            callback?.({
                                text: "deposit failed",
                                content: { error: "Deposit failed" },
                            });
                        }
                    }
                } else {
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
                content: { text: "Deposit 1 USDC into the strategy" },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Deposit 10 gmYAK to earn yield" },
            },
        ],
    ] as ActionExample[][],
} as Action;
