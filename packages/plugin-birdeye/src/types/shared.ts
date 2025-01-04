import { BIRDEYE_SUPPORTED_CHAINS } from "../utils";

// Types
export type BirdeyeSupportedChain = (typeof BIRDEYE_SUPPORTED_CHAINS)[number];

export interface BaseAddress {
    type?: "wallet" | "token" | "contract";
    symbol?: string;
    address: string;
    chain: BirdeyeSupportedChain;
}

export interface WalletAddress extends BaseAddress {
    type: "wallet";
}

export interface TokenAddress extends BaseAddress {
    type: "token";
}

export interface ContractAddress extends BaseAddress {
    type: "contract";
}
