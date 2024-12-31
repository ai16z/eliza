import { Plugin } from "@elizaos/core";
import { transferAction } from "./actions/transfer";
import { fuelWalletProvider } from "./providers/wallet";

export const fuelPlugin: Plugin = {
    name: "fuel",
    description: "Fuel blockchain integration plugin",
    providers: [fuelWalletProvider],
    evaluators: [],
    services: [],
    actions: [transferAction],
};

export default fuelPlugin;
