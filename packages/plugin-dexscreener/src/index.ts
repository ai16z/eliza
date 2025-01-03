export * from "./actions/getTokens";

import type { Plugin } from "@elizaos/core";
import {
    getLatestTokensAction,
    getLatestBoostedTokensAction,
    getTopBoostedTokensAction,
} from "./actions/getTokens";

export const dexscreenerPlugin: Plugin = {
    name: "dexscreener",
    description: "dexscreener blockchain integration plugin",
    providers: [],
    evaluators: [],
    services: [],
    actions: [
        getLatestTokensAction,
        getLatestBoostedTokensAction,
        getTopBoostedTokensAction,
    ],
};

export default dexscreenerPlugin;
