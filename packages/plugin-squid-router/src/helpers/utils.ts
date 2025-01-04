import { IAgentRuntime } from "@elizaos/core";
import { z } from 'zod';
import { ethers } from 'ethers';
import { bech32 } from 'bech32';
import bs58 from 'bs58';
import {SquidToken, XChainSwapContent} from "../types";

export function convertToWei(amount: string | number, token: SquidToken): string {
    if (typeof token.decimals !== 'number' || token.decimals < 0 || token.decimals > 255) {
        throw new Error("Invalid decimals value in token object.");
    }

    try {
        // Ensure amount is a string for ethers.js
        const amountString = typeof amount === 'number' ? amount.toString() : amount;

        // Use ethers.js to parse the amount into the smallest unit
        const parsedAmount = ethers.parseUnits(amountString, token.decimals);

        // Return the parsed amount as a string
        return parsedAmount.toString();
    } catch (error) {
        throw new Error(`Failed to convert amount: ${(error as Error).message}`);
    }
}


export function isXChainSwapContent(
    content: XChainSwapContent
): boolean {

    // Validate types
    const validTypes =
        typeof content.fromChain === "string" &&
        typeof content.toChain === "string" &&
        typeof content.fromToken === "string" &&
        typeof content.toToken === "string" &&
        typeof content.toAddress === "string" &&
        (typeof content.amount === "string" ||
            typeof content.amount === "number");
    if (validTypes) {
        return true;
    }
    return false
}

// Helper Validation Functions

const isValidEvmAddress = (address: string): boolean => {
    return ethers.isAddress(address);
};

const isValidEvmPrivateKey = (key: string): boolean => {
    const cleanedKey = key.startsWith('0x') ? key.slice(2) : key;
    return /^[0-9a-fA-F]{64}$/.test(cleanedKey);
};

const isValidSolanaAddress = (address: string): boolean => {
    try {
        const decoded = bs58.decode(address);
        return decoded.length === 32; // Corrected from 32 || 44 to only 32
    } catch {
        return false;
    }
};

const isValidSolanaPrivateKey = (key: string): boolean => {
    return /^[0-9a-fA-F]{64}$/.test(key);
};

const isValidCosmosAddress = (address: string): boolean => {
    try {
        const decoded = bech32.decode(address);
        return decoded.prefix.startsWith('cosmos') && decoded.words.length === 52;
    } catch {
        return false;
    }
};

const isValidCosmosPrivateKey = (key: string): boolean => {
    return /^[0-9a-fA-F]{64}$/.test(key);
};

export const squidRouterEnvSchema = z
    .object({
        SQUID_INTEGRATOR_ID: z.string().min(1, "Squid Integrator ID is required"),
        SQUID_SDK_URL: z.string().min(1, "Squid SDK URL is required"),

        SQUID_EVM_ADDRESS: z.string().min(1, "Squid Integrator ID is required"),
        SQUID_EVM_PRIVATE_KEY: z.string().min(1, "Squid Integrator ID is required"),
    })
    .refine((data) => {
        // Check if EVM pair is valid
        const evmValid =
            (data.SQUID_EVM_ADDRESS && data.SQUID_EVM_PRIVATE_KEY) &&
            isValidEvmAddress(data.SQUID_EVM_ADDRESS) &&
            isValidEvmPrivateKey(data.SQUID_EVM_PRIVATE_KEY);

        return evmValid;
    }, {
        message: "At least one valid address and private key pair is required: EVM, Solana, or Cosmos.",
        path: [], // Global error
    })
    .superRefine((data, ctx) => {
        // EVM Validation
        if (data.SQUID_EVM_ADDRESS || data.SQUID_EVM_PRIVATE_KEY) {
            if (data.SQUID_EVM_ADDRESS && !isValidEvmAddress(data.SQUID_EVM_ADDRESS)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "EVM_ADDRESS is invalid or not checksummed correctly.",
                    path: ["EVM_ADDRESS"],
                });
            }

            if (data.SQUID_EVM_PRIVATE_KEY && !isValidEvmPrivateKey(data.SQUID_EVM_PRIVATE_KEY)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "EVM_PRIVATE_KEY must be a 64-character hexadecimal string.",
                    path: ["EVM_PRIVATE_KEY"],
                });
            }

            if ((data.SQUID_EVM_ADDRESS && !data.SQUID_EVM_PRIVATE_KEY) || (!data.SQUID_EVM_ADDRESS && data.SQUID_EVM_PRIVATE_KEY)) {
                if (!data.SQUID_EVM_ADDRESS) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "EVM_ADDRESS is required when EVM_PRIVATE_KEY is provided.",
                        path: ["EVM_ADDRESS"],
                    });
                }
                if (!data.SQUID_EVM_PRIVATE_KEY) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "EVM_PRIVATE_KEY is required when EVM_ADDRESS is provided.",
                        path: ["EVM_PRIVATE_KEY"],
                    });
                }
            }
        }
    });

export type SquidRouterConfig = z.infer<typeof squidRouterEnvSchema>;

export async function validateSquidRouterConfig(
    runtime: IAgentRuntime
): Promise<SquidRouterConfig> {
    try {
        const config = {
            SQUID_INTEGRATOR_ID: runtime.getSetting("SQUID_INTEGRATOR_ID"),
            SQUID_SDK_URL: runtime.getSetting("SQUID_SDK_URL"),
            SQUID_EVM_ADDRESS: runtime.getSetting("SQUID_EVM_ADDRESS"),
            SQUID_EVM_PRIVATE_KEY: runtime.getSetting("SQUID_EVM_PRIVATE_KEY"),
        };

        return squidRouterEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Squid Router configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
