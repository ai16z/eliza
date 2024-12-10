export * from "./actions/bridge";
export * from "./actions/swap";
export * from "./actions/transfer";
export * from "./actions/getbalance";
export * from "./actions/getTokenInfo";
export * from "./providers/wallet";
export * from "./types";
export * from "./abis/erc20";

import type { Plugin } from "@ai16z/eliza";
import { bridgeAction } from "./actions/bridge";
import { swapAction } from "./actions/swap";
import { transferAction } from "./actions/transfer";
import { evmWalletProvider } from "./providers/wallet";
import { getbalanceAction } from "./actions/getbalance";
import { getTokenInfoAction } from "./actions/getTokenInfo";

export const evmPlugin: Plugin = {
    name: "evm",
    description: "EVM blockchain integration plugin",
    providers: [evmWalletProvider],
    evaluators: [],
    services: [],
    actions: [transferAction, bridgeAction, swapAction, getbalanceAction, getTokenInfoAction],
};

export default evmPlugin;