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
import { validateAvalancheConfig } from "../environment";
import { createMarketAndToken } from "../utils/tokenMill";

export interface TokenMillCreateContent extends Content {
    name: string;
    symbol: string;
}

function isTokenMillCreateContent(
    runtime: IAgentRuntime,
    content: any
): content is TokenMillCreateContent {
    elizaLogger.debug("Content for create", content);
    return (
        typeof content.name === "string" && typeof content.symbol === "string"
    );
}

const transferTemplate = `Respond with a JSON markdown block containing only the extracted values.

If the user did not provide enough details, respond with what you can. Name and Symbol are required.

Example response for a new token:
\`\`\`json
{
    "name": "Test Token",
    "symbol": "TEST"
}
\`\`\`

## Recent Messages

{{recentMessages}}

Given the recent messages, extract the following information about the requested token creation:
- Name
- Symbol

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "CREATE_TOKEN",
    similes: [
        "LAUNCH_TOKEN",
        "NEW_TOKEN",
        "CREATE_MEMECOIN",
        "CREATE_MEME_TOKEN",
    ],
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        await validateAvalancheConfig(runtime);
        return true;
    },
    description:
        "MUST use this action if the user requests to create a new token, the request might be varied, but it will always be a token creation.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting CREATE_TOKEN handler...");

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

        elizaLogger.debug("Create content:", content);

        // Validate transfer content
        if (!isTokenMillCreateContent(runtime, content)) {
            elizaLogger.error("Invalid content for CREATE_TOKEN action.");
            callback?.({
                text: "Unable to process transfer request. Invalid content provided.",
                content: { error: "Invalid content" },
            });
            return false;
        }

        const { tx, baseToken, market } = await createMarketAndToken(
            runtime,
            content.name,
            content.symbol
        );
        callback?.({
            text: `Created token ${content.name} with symbol ${content.symbol}. CA: ${baseToken}`,
            content: { tx, baseToken, market },
        });
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a new memecoin called 'Test Token' with the symbol 'TEST'",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "CREATE_TOKEN",
                    name: "Test Token",
                    symbol: "TEST",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Create a token called news" },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "CREATE_TOKEN",
                    name: "News Token",
                    symbol: "NEWS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Create a token" },
            },
            {
                user: "{{user2}}",
                content: {
                    action: "CREATE_TOKEN",
                    name: "Okay",
                    symbol: "OK",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
