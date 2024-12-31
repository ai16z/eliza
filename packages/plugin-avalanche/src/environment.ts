import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const avalancheEnvSchema = z.object({
    AVALANCHE_PRIVATE_KEY: z
        .string()
        .min(1, "Avalanche private key is required"),
});

export type AvalancheConfig = z.infer<typeof avalancheEnvSchema>;
export async function validateAvalancheConfig(
    runtime: IAgentRuntime
): Promise<AvalancheConfig> {
    try {
        const config = {
            AVALANCHE_PRIVATE_KEY:
                runtime.getSetting("AVALANCHE_PRIVATE_KEY") ||
                process.env.AVALANCHE_PRIVATE_KEY,
        };

        return avalancheEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(errorMessages);
        }
        throw error;
    }
}
