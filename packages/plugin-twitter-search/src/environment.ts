import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

// Schema for environment variables
export const twitterApiEnvSchema = z.object({
    TWITTER_API_IO_KEY: z.string().min(1, "Twitter API key is required")
});

// Type inference
export type TwitterApiConfig = {
    TWITTER_API_IO_KEY: string;
    BASE_URL: string;
    CACHE_DURATION: number;
    RETRY_ATTEMPTS: number;
    RETRY_DELAY: number;
};

/**
 * Validates and processes Twitter API configuration
 * @param runtime Agent runtime context
 * @returns Validated Twitter API configuration
 */
export async function validateTwitterApiConfig(
    runtime: IAgentRuntime
): Promise<TwitterApiConfig> {
    // Get API key from character secrets or environment
    const envConfig = {
        TWITTER_API_IO_KEY: runtime.getSetting("TWITTER_API_IO_KEY") || process.env.TWITTER_API_IO_KEY
    };

    // Parse and validate configuration
    const result = twitterApiEnvSchema.safeParse(envConfig);

    if (!result.success) {
        throw new Error(
            `Twitter API configuration validation failed: ${result.error.message}`
        );
    }

    // Return final config with hardcoded values
    return {
        TWITTER_API_IO_KEY: result.data.TWITTER_API_IO_KEY,
        BASE_URL: "https://api.twitterapi.io",
        CACHE_DURATION: 30, // 30 seconds
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    };
}
