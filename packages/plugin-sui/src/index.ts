import { Plugin } from "@ai16z/eliza";
import { WalletProvider, walletProvider } from "./providers/wallet.ts";

export { WalletProvider };

export const suiPlugin: Plugin = {
    name: "sui",
    description: "Sui Plugin for Eliza",
    actions: [],
    evaluators: [],
    providers: [walletProvider],
};

export default suiPlugin;
