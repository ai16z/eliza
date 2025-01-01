import {
    Action,
    ActionExample,
    composeContext,
    Content,
    elizaLogger,
    generateObject,
    generateObjectDeprecated,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@elizaos/core";
import { PublicKey } from "@metaplex-foundation/umi";
import { MplBubblegumProvider } from "../providers/bubblegumProvider";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";

export interface TransferContent extends Content {
    assetId: string;
}

function isFetchContent(
    _runtime: IAgentRuntime,
    content: any
): content is TransferContent {
    console.log("Content for cNFT fetch", content);
    return typeof content.assetId === "string";
}

const fetchTemplate = `Respond with a JSON markdown block containing only the extracted values. Ensure that all extracted values, especially public key addresses, are complete and include every character as they appear in the messages. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "assetId": "54dQ8cfHsW1YfKYpmdVZhWpb9iSi6Pac82Nf7sg3bVb",
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information for fetching:
- Asset Id

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "FETCH_COMPRESSED_NFT",
    similes: ["FETCH_CNFT", "SEARCH_COMPRESSED_NFT", "SEARCH_CNFT"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    description: "Fetch details of a compressed NFT (cNFT)",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting FETCH_COMPRESSED_NFT handler...");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const fetchContext = composeContext({
            state,
            template: fetchTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context: fetchContext,
            modelClass: ModelClass.LARGE,
        });

        if (!isFetchContent(runtime, content)) {
            console.error("Invalid content for FETCH_COMPRESSED_NFT action");
            if (callback) {
                callback({
                    text: "Unable to process transfer request. Invalid content provided.",
                    content: { error: "Invalid transfer content" },
                });
            }
            return false;
        }
        try {
            const RPC_URL = runtime.getSetting("MPL_BUBBLEGUM_RPC_URL");

            const mplBubblegumProvider = new MplBubblegumProvider(RPC_URL);

            const cNFT: DasApiAsset = await mplBubblegumProvider.getAsset(
                content.assetId as PublicKey
            );

            console.log("Fetch successful: ", content.assetId);

            if (callback) {
                callback({
                    text: `
                    Here are the details for ${content.assetId}\n\n
                    - Name: ${cNFT.content.metadata.name}\n\n
                    - Description: ${cNFT.content.metadata.description}\n\n
                    - Creator: ${cNFT.creators.map((creator) => creator.address).join(", ")}\n\n
                    - Uri ${cNFT.content.json_uri}\n\n
                    - Royalties: ${cNFT.royalty.percent * 100} %\n\n
                    - Collection: ${cNFT.grouping[0].group_value} \n\n
                    `,
                    content: {
                        asset: cNFT,
                    },
                });
            }

            return true;
        } catch (error) {
            console.error("Error in transfer", error);
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
                    text: "Get details for 2q5tF7QjzY2RKtjrizS32kPgYKSP2xjSTe2wxPZXY2JH",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Getting details for 2q5tF7QjzY2RKtjrizS32kPgYKSP2xjSTe2wxPZXY2JH now...",
                    action: "FETCH_COMPRESSED_NFT",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: `Here are the details for 2q5tF7QjzY2RKtjrizS32kPgYKSP2xjSTe2wxPZXY2JH\n
                    - Name: Cool NFT\n - Description: A very cool NFT\n
                    - Creator: 5QrQzQk5nnTJbBhdnwwwmQr94AQUkMEaZkDbU5HsvKMY\n
                    - Uri 'https://ipfs.io/ipfs/Qmb5yyc22CBZKh2XwU3oNbSyVkMWLxxgoMaMYLmD7EkAe4'\n
                    - Creators:\n
                        'address': '5QrQzQk5nnTJbBhdnwwwmQr94AQUkMEaZkDbU5HsvKMY',\n
                            'share': 50,\n
                            'verified': false,\n
                        'address': '2HAjX3wYpfRfcBNk36mWjzXWFKUiKjB5Lj5H2rEFdAG8',\n
                            'share': 50,\n
                            'verified': true \n
                    - Royalties: 2%
                    - Collection: AXvaYiSwE7XKdiM4eSWTfagkswmWKVF7KzwW5EpjCDGk\n
                    `,
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Fetch the details of cNFT 7g1tX9HkjLyZRftoc4vA7KkJ2nM9YXotRkTyUj9Np5DL",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Getting details for 7g1tX9HkjLyZRftoc4vA7KkJ2nM9YXotRkTyUj9Np5DL now...",
                    action: "FETCH_COMPRESSED_NFT",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: `Here are the details for 7g1tX9HkjLyZRftoc4vA7KkJ2nM9YXotRkTyUj9Np5DL\n
                    - Name: Cool NFT\n - Description: A very cool NFT\n
                    - Creator: 2HAjX3wYpfRfcBNk36mWjzXWFKUiKjB5Lj5H2rEFdAG8\n
                    - Uri 'https://ipfs.io/ipfs/Qmb5yyc22CBZKh2XwU3oNbSyVkMWLxxgoMaMYLmD7EkAe4'\n
                    - Creators:\n
                        'address': '5QrQzQk5nnTJbBhdnwwwmQr94AQUkMEaZkDbU5HsvKMY',\n
                            'share': 50,\n
                            'verified': false,\n
                        'address': '2HAjX3wYpfRfcBNk36mWjzXWFKUiKjB5Lj5H2rEFdAG8',\n
                            'share': 50,\n
                            'verified': true \n
                    - Royalties: 2%
                    - Collection: AXvaYiSwE7XKdiM4eSWTfagkswmWKVF7KzwW5EpjCDGk\n
                    `,
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Retrieve information for the compressed NFT 9h3rQ8PkZLYzLQkfDj8oJ9LnFQW7GYmRtMJkXN5QP9DJ",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Getting details for 9h3rQ8PkZLYzLQkfDj8oJ9LnFQW7GYmRtMJkXN5QP9DJ now...",
                    action: "FETCH_COMPRESSED_NFT",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: `Here are the details for 9h3rQ8PkZLYzLQkfDj8oJ9LnFQW7GYmRtMJkXN5QP9DJ\n
                    - Name: Cool NFT\n - Description: A very cool NFT\n
                    - Creator: 2HAjX3wYpfRfcBNk36mWjzXWFKUiKjB5Lj5H2rEFdAG8\n
                    - Uri 'https://ipfs.io/ipfs/Qmb5yyc22CBZKh2XwU3oNbSyVkMWLxxgoMaMYLmD7EkAe4'\n
                    - Creators:\n
                        'address': '5QrQzQk5nnTJbBhdnwwwmQr94AQUkMEaZkDbU5HsvKMY',\n
                            'share': 50,\n
                            'verified': false,\n
                        'address': '2HAjX3wYpfRfcBNk36mWjzXWFKUiKjB5Lj5H2rEFdAG8',\n
                            'share': 50,\n
                            'verified': true \n
                    - Royalties: 2%
                    - Collection: AXvaYiSwE7XKdiM4eSWTfagkswmWKVF7KzwW5EpjCDGk\n
                    `,
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
