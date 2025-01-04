import express from "express";

import { AgentRuntime } from "@elizaos/core";
import { createSolanaCollection } from "./handlers/createSolanaCollection.ts";
import { createNFT, createNFTMetadata } from "./handlers/createNFT.ts";
import { verifyNFT } from "./handlers/verifyNFT.ts";

export function createNFTApiRouter(
    agents: Map<string, AgentRuntime>
): express.Router {
    const router = express.Router();

    router.post(
        "/api/nft-generation/create-collection",
        async (req: express.Request, res: express.Response) => {
            const agentId = req.body.agentId;
            const fee = req.body.fee || 0;
            const runtime = agents.get(agentId);
            if (!runtime) {
                res.status(404).send("Agent not found");
                return;
            }
            try {
                const collectionAddressRes = await createSolanaCollection({
                    runtime,
                    collectionName: runtime.character.name,
                    fee,
                });

                res.json({
                    success: true,
                    data: collectionAddressRes,
                });
            } catch (e: any) {
                console.log(e);
                res.json({
                    success: false,
                    data: JSON.stringify(e),
                });
            }
        }
    );

    router.post(
        "/api/nft-generation/create-nft-metadata",
        async (req: express.Request, res: express.Response) => {
            const agentId = req.body.agentId;
            const collectionName = req.body.collectionName;
            const collectionAddress = req.body.collectionAddress;
            const collectionAdminPublicKey = req.body.collectionAdminPublicKey;
            const collectionFee = req.body.collectionFee;
            const tokenId = req.body.tokenId;
            const runtime = agents.get(agentId);
            if (!runtime) {
                res.status(404).send("Agent not found");
                return;
            }

            try {
                const nftInfo = await createNFTMetadata({
                    runtime,
                    collectionName,
                    collectionAdminPublicKey,
                    collectionFee,
                    tokenId,
                });

                res.json({
                    success: true,
                    data: {
                        ...nftInfo,
                        collectionAddress,
                    },
                });
            } catch (e: any) {
                console.log(e);
                res.json({
                    success: false,
                    data: JSON.stringify(e),
                });
            }
        }
    );

    router.post(
        "/api/nft-generation/create-nft",
        async (req: express.Request, res: express.Response) => {
            const agentId = req.body.agentId;
            const collectionName = req.body.collectionName;
            const collectionAddress = req.body.collectionAddress;
            const collectionAdminPublicKey = req.body.collectionAdminPublicKey;
            const collectionFee = req.body.collectionFee;
            const tokenId = req.body.tokenId;
            const runtime = agents.get(agentId);
            if (!runtime) {
                res.status(404).send("Agent not found");
                return;
            }

            try {
                const nftRes = await createNFT({
                    runtime,
                    collectionName,
                    collectionAddress,
                    collectionAdminPublicKey,
                    collectionFee,
                    tokenId,
                });

                res.json({
                    success: true,
                    data: nftRes,
                });
            } catch (e: any) {
                console.log(e);
                res.json({
                    success: false,
                    data: JSON.stringify(e),
                });
            }
        }
    );

    router.post(
        "/api/nft-generation/verify-nft",
        async (req: express.Request, res: express.Response) => {
            const agentId = req.body.agentId;
            const collectionAddress = req.body.collectionAddress;
            const NFTAddress = req.body.nftAddress;
            const token = req.body.token;

            const runtime = agents.get(agentId);
            if (!runtime) {
                res.status(404).send("Agent not found");
                return;
            }
            const verifyToken = runtime.getSetting("SOLANA_VERIFY_TOKEN");
            if (token !== verifyToken) {
                res.status(401).send(" Access denied for translation");
                return;
            }
            try {
                const { success } = await verifyNFT({
                    runtime,
                    collectionAddress,
                    NFTAddress,
                });

                res.json({
                    success: true,
                    data: success ? "verified" : "unverified",
                });
            } catch (e: any) {
                console.log(e);
                res.json({
                    success: false,
                    data: JSON.stringify(e),
                });
            }
        }
    );

    return router;
}
