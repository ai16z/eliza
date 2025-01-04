import { z } from "zod";
import { Content } from "@elizaos/core";
import * as viemChains from "viem/chains";

const _SupportedChainList = Object.keys(viemChains);
const supportedChainTuple = [..._SupportedChainList, 'solana'] as unknown as [string, ...string[]];

export interface MintNFTContent extends Content {
    collectionAddress: string;
    chainName: string;
}

export const MintNFTSchema = z.object({
    collectionAddress: z.string(),
    chainName: z.enum([...supportedChainTuple]).nullable(),
});

export const CreateCollectionSchema = z.object({
    chainName: z.enum([...supportedChainTuple]).nullable(),
});

