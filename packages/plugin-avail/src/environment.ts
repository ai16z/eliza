import { IAgentRuntime } from "@elizaos/eliza";
import { z } from "zod";

export const availEnvSchema = z.object({
    AVAIL_ADDRESS: z.string().min(1, "Avail address is required"),
    AVAIL_SEED: z.string().min(1, "Avail account seed phrase is required"),
});

export type availConfig = z.infer<typeof availEnvSchema>;

export async function validateAvailConfig(
    runtime: IAgentRuntime
): Promise<availConfig> {
    try {
        const config = {
            AVAIL_ADDRESS:
                runtime.getSetting("AVAIL_ADDRESS") ||
                process.env.AVAIL_ADDRESS,
            AVAIL_SEED:
                runtime.getSetting("AVAIL_SEED") ||
                process.env.AVAIL_SEED
        };

        return availEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Avail configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
