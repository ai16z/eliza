import { Plugin } from "@elizaos/core";
import transferToken from "./actions/transfer";
import { WalletProvider, walletProvider } from "./providers/wallet";

export { WalletProvider, transferToken as TransferMovementToken };

export const movementPlugin: Plugin = {
    name: "movement",
    description: "Movement Network Plugin for Eliza",
    actions: [transferToken],
    evaluators: [],
    providers: [walletProvider],
};

export default movementPlugin;
