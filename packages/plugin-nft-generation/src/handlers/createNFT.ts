import { AwsS3Service } from "@ai16z/plugin-node";
import {
    composeContext,
    elizaLogger,
    generateImage,
    generateText,
    getEmbeddingZeroVector,
    IAgentRuntime,
    Memory,
    ModelClass,
    ServiceType,
    stringToUuid,
} from "@ai16z/eliza";
import {
    saveBase64Image,
    saveHeuristImage,
} from "@ai16z/plugin-image-generation";
import { PublicKey } from "@solana/web3.js";
import WalletSolana from "../provider/wallet/walletSolana.ts";

const nftTemplate = `
# Areas of Expertise
{{knowledge}}

# About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{characterPostExamples}}

{{postDirections}}
# Task: Generate an image to Prompt the  {{agentName}}'s appearance, with the total character count MUST be less than 280.
`;

export async function createNFTMetadata({
    runtime,
    collectionName,
    collectionAdminPublicKey,
    collectionFee,
    tokenId,
}: {
    runtime: IAgentRuntime;
    collectionName: string;
    collectionAdminPublicKey: string;
    collectionFee: number;
    tokenId: number;
}) {
    const userId = runtime.agentId;
    elizaLogger.log("User ID:", userId);
    const awsS3Service: AwsS3Service = runtime.getService(ServiceType.AWS_S3);
    const agentName = runtime.character.name;
    const roomId = stringToUuid("nft_generate_room-" + agentName);
    // Create memory for the message
    const memory: Memory = {
        agentId: userId,
        userId,
        roomId,
        content: {
            text: "",
            source: "nft-generator",
        },
        createdAt: Date.now(),
        embedding: getEmbeddingZeroVector(),
    };
    const state = await runtime.composeState(memory, {
        collectionName,
    });

    const context = composeContext({
        state,
        template: nftTemplate,
    });

    let nftPrompt = await generateText({
        runtime,
        context,
        modelClass: ModelClass.MEDIUM,
    });

    nftPrompt += runtime.character?.nft?.prompt || "";
    nftPrompt += "The image should only feature one person.";

    const images = await generateImage(
        {
            prompt: nftPrompt,
            width: 1024,
            height: 1024,
        },
        runtime
    );
    elizaLogger.log("NFT Prompt:", nftPrompt);
    if (images.success && images.data && images.data.length > 0) {
        const image = images.data[0];
        const filename = `${tokenId}`;
        if (image.startsWith("http")) {
            elizaLogger.log("Generating image url:", image);
        }
        // Choose save function based on image data format
        const filepath = image.startsWith("http")
            ? await saveHeuristImage(image, filename)
            : saveBase64Image(image, filename);
        const nftImage = await awsS3Service.uploadFile(
            filepath,
            `/${collectionName}/items/${tokenId}`,
            false
        );
        const nftInfo = {
            name: `${collectionName} #${tokenId}`,
            description: `${collectionName} #${tokenId}`,
            symbol: `#${tokenId}`,
            adminPublicKey: collectionAdminPublicKey,
            fee: collectionFee,
            uri: "",
        };
        const jsonFilePath = await awsS3Service.uploadJson(
            {
                name: nftInfo.name,
                description: nftInfo.description,
                image: nftImage.url,
            },
            "metadata.json",
            `/${collectionName}/items/${tokenId}`
        );

        nftInfo.uri = jsonFilePath.url;
        return {
            ...nftInfo,
            imageUri: nftImage.url
        };
    }
    return null;
}

export async function createNFT({
    runtime,
    collectionName,
    collectionAddress,
    collectionAdminPublicKey,
    collectionFee,
    tokenId,
}: {
    runtime: IAgentRuntime;
    collectionName: string;
    collectionAddress: string;
    collectionAdminPublicKey: string;
    collectionFee: number;
    tokenId: number;
}) {
    const nftInfo = await createNFTMetadata({
        runtime,
        collectionName,
        collectionAdminPublicKey,
        collectionFee,
        tokenId,
    });
    if (nftInfo) {
        const publicKey = runtime.getSetting("SOLANA_PUBLIC_KEY");
        const privateKey = runtime.getSetting("SOLANA_PRIVATE_KEY");

        const wallet = new WalletSolana(new PublicKey(publicKey), privateKey);

        const nftAddressRes = await wallet.mintNFT({
            name: nftInfo.name,
            uri: nftInfo.uri,
            symbol: nftInfo.symbol,
            collectionAddress,
            adminPublicKey: collectionAdminPublicKey,
            fee: collectionFee,
        });
        elizaLogger.log("NFT ID:", nftAddressRes.address);
        return {
            network: "solana",
            address: nftAddressRes.address,
            link: nftAddressRes.link,
            nftInfo,
        };
    }
    return;
}
