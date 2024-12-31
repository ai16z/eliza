import {
    elizaLogger,
    ActionExample,
    Memory,
    State,
    IAgentRuntime,
    type Action,
    HandlerCallback,
} from "@elizaos/core";
import { FereProService } from "../services/FereProService";

export interface FereMessageContent {
    message: string;
    stream?: boolean;
    debug?: boolean;
}

function isValidMessageContent(content: any): content is FereMessageContent {
    return typeof content.message === "string";
}

const _fereProTemplate = `Extract the core query from user input and respond with the requested data. If the user asks for a comparison or historical data, make sure to reflect that accurately.

Example:
\`\`\`json
{
    "message": "Compare top 3 coins against Bitcoin in the last 3 months",
    "stream": true,
    "debug": false
}
\`\`\`

{{recentMessages}}

Extract the core request and execute the appropriate action.`;

export default {
    name: "SEND_FEREPRO_MESSAGE",
    similes: ["QUERY_MARKET", "ASK_AGENT"],
    description:
        "Send a message to FerePro API and receive streaming or non-streaming responses.",

    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        console.log("Validating environment for FerePro...");
        const user = runtime.getSetting("FERE_USER_ID");
        if (!user) {
            throw new Error("FERE_USER_ID not set in runtime.");
        }
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Executing SEND_FEREPRO_MESSAGE...");

        // Ensure state exists or generate a new one
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        // Compose context for the WebSocket message
        const context = {
            message: message.content.text,
            stream: message.content.stream || false,
            debug: message.content.debug || false,
        };

        if (!isValidMessageContent(context)) {
            console.error("Invalid content for SEND_FEREPRO_MESSAGE.");
            if (callback) {
                callback({
                    text: "Unable to process request. Invalid message content.",
                    content: { error: "Invalid message content" },
                });
            }
            return false;
        }

        // Send the message via WebSocket using FereProService
        try {
            const service = new FereProService();
            await service.initialize(runtime);

            const response = await service.sendMessage(context);

            if (response.success) {
                if (callback) {
                    callback({
                        text: "Response received from FerePro.",
                        content: response.data,
                    });
                }
                return true;
            } else {
                throw new Error(response.error || "Unknown WebSocket error.");
            }
        } catch (error) {
            console.error("Error during WebSocket communication:", error);
            if (callback) {
                callback({
                    text: `Error sending message: ${error.message}`,
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
                    text: "What are the top 5 cryptocurrencies?",
                    action: "SEND_FEREPRO_MESSAGE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Here are the top 5 cryptocurrencies.",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Compare Ethereum and Bitcoin for the past 6 months.",
                    action: "SEND_FEREPRO_MESSAGE",
                    stream: true,
                    debug: true,
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Streaming Ethereum and Bitcoin comparison...",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
