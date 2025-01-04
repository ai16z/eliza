import { composeContext, elizaLogger, ModelClass  } from "@ai16z/eliza";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@ai16z/eliza";
import { transferSOL } from "./util";
const pumpfunTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
        "twitter": "username",
        "chain": "solana",
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract or generate (come up with if not included) the following information about the requested token creation:
- twitter: twitter username or userhandle
- chain: blockchain type only includes icp, eth, solana, doge


Respond with a JSON markdown block containing only the extracted values.`;

const fetchVlyWalletAddress: Action = {
    name: "SOLANA_BLOCKCHAIN_DISCUSSION",
    similes: [
        "SOLANA_RELEATED_DISCUSSION",
        "SOLANA_BLOCKCHAIN_DISCUSSION",
        "SOLANA_COMMUNITY_DISCUSSION",
        "SOLANA_DEVELOPMENT_DISCUSSION",
        "SOLANA_ECOLOGY_DISCUSSION",
        "SOLANA_COMMUNITY_DISCUSSION",
    ],
    description: "tip solana token to the user when talking about solana blockchain topic",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        // Validate if secret token is configured
        elizaLogger.log("process.env.VLY_MONEY_API_KEY", process.env.VLY_MONEY_API_KEY);
        return !!process.env.VLY_MONEY_API_KEY;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Composing state for message:", JSON.stringify(message));
        state = (await runtime.composeState(message)) as State;
        const userId = runtime.agentId;

        try {
             // Generate structured content from natural language
        // const pumpContext = composeContext({
        //     state,
        //     template: pumpfunTemplate,
        // });

        // const content = await generateObjectDEPRECATED({
        //     runtime,
        //     context: pumpContext,
        //     modelClass: ModelClass.LARGE,
        // });

        elizaLogger.log("getAccountById(message.userId)", message.userId);
        const user = await runtime.databaseAdapter.getAccountById(message.userId);
        elizaLogger.log("user", JSON.stringify(user));
        // {"id":"a1334d38-d791-0d79-b6df-f26ab095f509","createdAt":"2024-12-17 17:03:21","name":"","username":"tracyhan0812","email":"twitter","avatarUrl":null,"details":{"summary":""}}

            const secretToken = process.env.VLY_MONEY_API_KEY;
            const url = 'https://service.vly.money/api/third_party/user_mapping';

            const params = new URLSearchParams({
                chain: 'solana',
                name: user.username,
                scope: 'twitter'
            });

            elizaLogger.log("Fetching wallet address from VLY Money API: ", user.username);
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: {
                    'secret-token': secretToken
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            elizaLogger.log("Successfully fetched wallet address from VLY Money");
            const address = data.data.address;
            elizaLogger.log(JSON.stringify(address));

            await transferSOL(address, 0.001);

            elizaLogger.log("Successfully transferred SOL to wallet address: ", address);

            if(!callback) {
                elizaLogger.log("No Callback.");
            } else {
                callback(
                    {
                        text: "Successfully fetched Twitter user's wallet address",
                        attachments: [
                            {
                                id: crypto.randomUUID(),
                                title: "Twitter User's Crypto Wallet",
                                source: "vlyMoney",
                                description: "Crypto wallet address for Twitter user",
                                "url": "https://vly.money/",
                                text: data,
                            },
                        ],
                    },
                    []
                );
            }
        } catch (error) {
            elizaLogger.error("Failed to fetch from VLY Money:", error);
            callback({
                text: "Failed to fetch wallet address: " + error.message,
                error: true,
            });
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "what makes solana blockchain unique?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Solana blockchain is unique because it has a high throughput and low cost. Since you mentioned it, I'm going to tip you 0.001 SOL.",
                    action: "TIP_SOLANA_TOKEN",
                },
            },
        ],
    ],
} as Action;

export const vlyMoneyPlugin: Plugin = {
    name: "vlyMoney",
    description: "distribute 0.001 solana token to the user when talking about solana blockchain topic",
    actions: [fetchVlyWalletAddress],
    evaluators: [],
    providers: [],
};
