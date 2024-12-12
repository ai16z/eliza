import {
    Action,
    elizaLogger,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@ai16z/eliza";

import { createCollection } from "./handlers/createCollection.ts";
import { createNFT } from "./handlers/createNFT.ts";
import { verifyNFT } from "./handlers/verifyNFT.ts";

export * from "./provider/wallet/walletSolana.ts";
export * from "./api.ts";


export async function sleep(ms: number = 3000) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const nftCollectionGeneration: Action = {
    name: "GENERATE_COLLECTION",
    similes: [
        "COLLECTION_GENERATION",
        "COLLECTION_GEN",
        "CREATE_COLLECTION",
        "MAKE_COLLECTION",
        "GENERATE_COLLECTION",
    ],
    description: "Generate an NFT collection for the message",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        const AwsAccessKeyIdOk = !!runtime.getSetting("AWS_ACCESS_KEY_ID");
        const AwsSecretAccessKeyOk = !!runtime.getSetting(
            "AWS_SECRET_ACCESS_KEY"
        );
        const AwsRegionOk = !!runtime.getSetting("AWS_REGION");
        const AwsS3BucketOk = !!runtime.getSetting("AWS_S3_BUCKET");

        return (
            AwsAccessKeyIdOk ||
            AwsSecretAccessKeyOk ||
            AwsRegionOk ||
            AwsS3BucketOk
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { [key: string]: unknown },
        callback: HandlerCallback
    ) => {
        try {
            elizaLogger.log("Composing state for message:", message);
            const userId = runtime.agentId;
            elizaLogger.log("User ID:", userId);

            const collectionAddressRes = await createCollection({
                runtime,
                collectionName: runtime.character.name,
            });

            const collectionInfo = collectionAddressRes.collectionInfo;

            elizaLogger.log("Collection Address:", collectionAddressRes);

            const nftRes = await createNFT({
                runtime,
                collectionName: collectionInfo.name,
                collectionAddress: collectionAddressRes.address,
                collectionAdminPublicKey: collectionInfo.adminPublicKey,
                collectionFee: collectionInfo.fee,
                tokenId: 1,
            });

            elizaLogger.log("NFT Address:", nftRes);


            callback({
                text: `Congratulations to you! 🎉🎉🎉 \nCollection : ${collectionAddressRes.link}\n NFT: ${nftRes.link}`, //caption.description,
                attachments: [],
            });
            await sleep(15000);
            await verifyNFT({
                runtime,
                collectionAddress: collectionAddressRes.address,
                NFTAddress: nftRes.address,
            });
            return [];
        } catch (e: any) {
            console.log(e);
        }

        // callback();
    },
    examples: [
        // TODO: We want to generate images in more abstract ways, not just when asked to generate an image

        [
            {
                user: "{{user1}}",
                content: { text: "Generate a collection" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here's the collection you requested.",
                    action: "GENERATE_COLLECTION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Generate a collection using {{agentName}}" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "We've successfully created a collection.",
                    action: "GENERATE_COLLECTION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Create a collection using {{agentName}}" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here's the collection you requested.",
                    action: "GENERATE_COLLECTION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Build a Collection" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "The collection has been successfully built.",
                    action: "GENERATE_COLLECTION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Assemble a collection with {{agentName}}" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "The collection has been assembled",
                    action: "GENERATE_COLLECTION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Make a collection" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "The collection has been produced successfully.",
                    action: "GENERATE_COLLECTION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Compile a collection" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "The collection has been compiled.",
                    action: "GENERATE_COLLECTION",
                },
            },
        ],
    ],
} as Action;

export const nftGenerationPlugin: Plugin = {
    name: "nftCollectionGeneration",
    description: "Generate NFT Collections",
    actions: [nftCollectionGeneration],
    evaluators: [],
    providers: [],
};
