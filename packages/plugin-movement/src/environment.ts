import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const movementEnvSchema = z.object({
    MOVEMENT_PRIVATE_KEY: z.string().min(1, "Movement private key is required"),
    MOVEMENT_NETWORK: z.enum(["mainnet", "bardock"]).default("bardock"),
});

export type MovementConfig = z.infer<typeof movementEnvSchema>;

export async function validateMovementConfig(
    runtime: IAgentRuntime
): Promise<MovementConfig> {
    try {
        const config = {
            MOVEMENT_PRIVATE_KEY:
                runtime.getSetting("MOVEMENT_PRIVATE_KEY") ||
                process.env.MOVEMENT_PRIVATE_KEY,
            MOVEMENT_NETWORK:
                runtime.getSetting("MOVEMENT_NETWORK") ||
                process.env.MOVEMENT_NETWORK ||
                "bardock",
        };

        return movementEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Movement configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}