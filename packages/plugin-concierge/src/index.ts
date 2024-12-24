import { Plugin } from "@ai16z/eliza";
import {
    fundAction,
    withdrawAction,
    balanceAction,
    walletDetailsAction,
    transferAction,
    showPrivateKey,
    swapAction,
} from "./actions/walletservice";
export { WalletService } from "./actions/cdp";

export const conciergePlugin: Plugin = {
    name: "concierge",
    description: "Provides wallet management and transaction capabilities.",
    actions: [
        showPrivateKey,
        fundAction,
        withdrawAction,
        balanceAction,
        walletDetailsAction,
        transferAction,
        swapAction,
    ],
};
