import { IAgentRuntime } from "@ai16z/eliza";
import { PublicKey } from "@solana/web3.js";
import WalletSolana from "../provider/wallet/walletSolana.ts";

export async function verifyNFT({
    runtime,
    collectionAddress,
    NFTAddress,
}: {
    runtime: IAgentRuntime;
    collectionAddress: string;
    NFTAddress: string;
}) {
    const adminPublicKey = runtime.getSetting("SOLANA_ADMIN_PUBLIC_KEY");
    const adminPrivateKey = runtime.getSetting("SOLANA_ADMIN_PRIVATE_KEY");
    const adminWallet = new WalletSolana(
        new PublicKey(adminPublicKey),
        adminPrivateKey
    );
    await adminWallet.verifyNft({
        collectionAddress,
        nftAddress: NFTAddress,
    });
    return {
        success: true,
    };
}
