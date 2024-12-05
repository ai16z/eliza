import { IAgentRuntime } from "@ai16z/eliza";
import { z } from "zod";

export const multiversxEnvSchema = z.object({
});

export type MultiversxConfig = z.infer<typeof multiversxEnvSchema>;

export async function validateMultiversxConfig(
    runtime: IAgentRuntime
): Promise<MultiversxConfig> {
    try {
        const config = {

        };

        return multiversxEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `MultiversX configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
