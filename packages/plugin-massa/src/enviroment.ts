import type { IAgentRuntime } from "@elizaos/core";
import { PublicApiUrl } from "@massalabs/massa-web3";
import { z } from "zod";

export const massaEnvSchema = z.object({
    MASSA_PRIVATE_KEY: z.string().min(1, "Massa private key is required"),
    MASSA_RPC_URL: z.string().min(1, "Massa RPC URL is required"),
});

export type MassaConfig = z.infer<typeof massaEnvSchema>;

export async function validateConfig(
    runtime: IAgentRuntime
): Promise<MassaConfig> {
    try {
        const config = {
            MASSA_PRIVATE_KEY:
                runtime.getSetting("MASSA_PRIVATE_KEY") ||
                process.env.MASSA_PRIVATE_KEY,
            MASSA_RPC_URL:
                runtime.getSetting("MASSA_RPC_URL") ||
                process.env.MASSA_RPC_URL ||
                PublicApiUrl.Mainnet,
        };

        return massaEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Massa configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
