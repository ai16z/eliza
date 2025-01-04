import {squidRouterProvider} from "./providers/squidRouter.ts";

export * from "./actions/xChainSwap.ts";
export * from "./providers/squidRouter.ts";
export * from "./types";

import type { Plugin } from "@elizaos/core";
import { xChainSwapAction } from "./actions/xChainSwap.ts";

export const squidRouterPlugin: Plugin = {
    name: "squid-router",
    description: "Squid router plugin",
    providers: [squidRouterProvider],
    evaluators: [],
    services: [],
    actions: [xChainSwapAction],
};

export default squidRouterPlugin;
