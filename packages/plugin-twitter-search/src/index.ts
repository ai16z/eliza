import { Plugin, IAgentRuntime, elizaLogger } from "@elizaos/core";
import { TwitterApiClient } from "./client";
import { validateTwitterApiConfig } from "./environment";

export * from "./types";
export { TwitterApiClient } from "./client";
export { validateTwitterApiConfig } from "./environment";

export const TwitterApiPlugin: Plugin = {
    name: "twitter-api",
    
    async init(runtime: IAgentRuntime) {
        try {
            const config = await validateTwitterApiConfig(runtime);
            const apiClient = new TwitterApiClient(config);
            
            // Register the client to be available for other components
            runtime.registerService("twitterApi", apiClient);
            
            elizaLogger.info("Twitter API Plugin: Initialized successfully");
            
            return {
                async cleanup() {
                    elizaLogger.info("Twitter API Plugin: Cleaning up...");
                }
            };
        } catch (error) {
            elizaLogger.error("Twitter API Plugin: Initialization failed", error);
            throw error;
        }
    }
}

export default TwitterApiPlugin;
