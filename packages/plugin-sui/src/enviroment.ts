import { IAgentRuntime } from "@ai16z/eliza";
import { z } from "zod";

export const suiEnvSchema = z.object({
    SUI_PRIVATE_KEY: z.string().min(1, "Sui private key is required"),
    SUI_NETWORK: z.enum(["mainnet", "testnet"]),
});

export type SuiConfig = z.infer<typeof suiEnvSchema>;

export async function validateSuiConfig(
    runtime: IAgentRuntime
): Promise<SuiConfig> {
    try {
        const config = {
            SUI_PRIVATE_KEY:
                runtime.getSetting("SUI_PRIVATE_KEY") ||
                process.env.SUI_PRIVATE_KEY,
            SUI_NETWORK:
                runtime.getSetting("SUI_NETWORK") ||
                process.env.SUI_NETWORK,
        };

        return suiEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Sui configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
