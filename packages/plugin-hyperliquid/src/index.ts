import { Plugin, elizaLogger } from "@elizaos/core";
import { exchangeActions } from "./actions/exchange.actions";
import { infoActions } from "./actions/info.actions";
import { HyperliquidService } from "./hyperliquid.service";
import type { HyperliquidConfig } from "./types";

// Export all types and utilities for external use
export * from "./types";
export * from "./types/constants";
export * from "./utils/signing";
export * from "./actions/exchange.actions";
export * from "./actions/info.actions";

/**
 * Creates a new instance of the Hyperliquid plugin
 * @param config Plugin configuration
 * @returns Plugin instance
 */
export function createHyperliquidPlugin(config: HyperliquidConfig): Plugin {
    elizaLogger.info("Initializing Hyperliquid plugin", {
        baseUrl: config.baseUrl,
        network: config.network,
        walletAddress: config.walletAddress
    });

    const service = new HyperliquidService(config);

    elizaLogger.info("Hyperliquid plugin initialized successfully");

    return {
        name: "hyperliquid",
        description: "Hyperliquid plugin for spot and perpetual trading",
        actions: [...exchangeActions, ...infoActions],
        evaluators: [],
        providers: [],
        services: [service]
    };
}

// Export the plugin creation function as default
export default createHyperliquidPlugin;

// Export the service class for external use
export { HyperliquidService };
