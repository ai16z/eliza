import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

const TREASURE_PUBLIC_RPC = "https://rpc.treasure.lol";

export const treasureEnvSchema = z.object({
    TREASURE_ADDRESS: z.string().min(1, "Treasure address is required"),
    TREASURE_PRIVATE_KEY: z.string().min(1, "Treasure private key is required"),
    TREASURE_RPC_URL: z.string().min(1, "Treasure RPC URL is required"),
});

export type TreasureConfig = z.infer<typeof treasureEnvSchema>;

export async function validateTreasureConfig(
    runtime: IAgentRuntime
): Promise<TreasureConfig> {
    try {
        const config = {
            TREASURE_ADDRESS:
                runtime.getSetting("TREASURE_ADDRESS") ||
                process.env.TREASURE_ADDRESS,
            TREASURE_PRIVATE_KEY:
                runtime.getSetting("TREASURE_PRIVATE_KEY") ||
                process.env.TREASURE_PRIVATE_KEY,
            TREASURE_RPC_URL:
                runtime.getSetting("TREASURE_RPC_URL") ||
                process.env.TREASURE_RPC_URL ||
                TREASURE_PUBLIC_RPC,
        };

        return treasureEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Treasure configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
