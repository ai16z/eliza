import { z } from "zod";

// Define schemas for each skill
export const FundSchema = z.object({
    amount: z.number().positive().max(10),
});

export const BalanceSchema = z.object({
    address: z.literal("address").optional(),
});

export const WalletSchema = z.object({
    address: z.literal("address").optional(),
});

export const WithdrawSchema = z.object({
    amount: z.number().positive(),
});

export const TransferSchema = z.object({
    amount: z.number().positive(),
    recipient: z.string().min(1),
});

export const ShowPrivateKeySchema = z.object({
    address: z.string().min(1),
});

export const SwapSchema = z.object({
    amount: z.number().positive(),
    fromToken: z.enum(["eth", "usdc"]),
    toToken: z.enum(["eth", "usdc"]),
});

// Type definitions
export type FundContent = z.infer<typeof FundSchema>;
export type BalanceContent = z.infer<typeof BalanceSchema>;
export type WalletContent = z.infer<typeof WalletSchema>;
export type WithdrawContent = z.infer<typeof WithdrawSchema>;
export type TransferContent = z.infer<typeof TransferSchema>;
export type SwapContent = z.infer<typeof SwapSchema>;
export type ShowPrivateKeyContent = z.infer<typeof ShowPrivateKeySchema>;
// Type guards
export const isFundContent = (obj: any): obj is FundContent => {
    return FundSchema.safeParse(obj).success;
};

export const isBalanceContent = (obj: any): obj is BalanceContent => {
    return BalanceSchema.safeParse(obj).success;
};

export const isWalletContent = (obj: any): obj is WalletContent => {
    return WalletSchema.safeParse(obj).success;
};

export const isWithdrawContent = (obj: any): obj is WithdrawContent => {
    return WithdrawSchema.safeParse(obj).success;
};

export const isTransferContent = (obj: any): obj is TransferContent => {
    return TransferSchema.safeParse(obj).success;
};

export const isShowPrivateKeyContent = (
    obj: any
): obj is ShowPrivateKeyContent => {
    return ShowPrivateKeySchema.safeParse(obj).success;
};

export const isSwapContent = (obj: any): obj is SwapContent => {
    return SwapSchema.safeParse(obj).success;
};
