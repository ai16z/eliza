import { Plugin } from "@elizaos/core";
import { walletProvider } from "./providers/wallet";
import executeTransfer from "./actions/transfer";

export const cosmosPlugin: Plugin = {
    name: "COSMOS",
    description: "Cosmos (e.g. Osmosis) Plugin for Eliza",
    providers: [walletProvider],
    actions: [executeTransfer],
    evaluators: [],
};

export default cosmosPlugin;
