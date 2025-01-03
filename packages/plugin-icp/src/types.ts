import type { Principal } from "@dfinity/principal";
import type { ActorSubclass } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";
export interface ICPConfig {
    privateKey: string;
    network?: "mainnet" | "testnet";
}

export interface TransferParams {
    to: Principal | string;
    amount: bigint;
    memo?: bigint;
}

export type Platform = 'launch-bob' | 'pick-pump';

export interface ICPBalance {
    e8s: bigint;
}

export interface TransferResult {
    Ok?: bigint;
    Err?: string;
}

export interface ICPProvider {
    getBalance(principal: string): Promise<ICPBalance>;
    transfer(params: TransferParams): Promise<TransferResult>;
}

// Credentials obtained after login, used to create an actor with the logged-in identity. The actor can call canister methods
export type ActorCreator = <T>(
    idlFactory: IDL.InterfaceFactory, // Candid interface
    canister_id: string // Target canister
) => Promise<ActorSubclass<T>>;

export type CreateMemeTokenArg = {
    name: string;
    symbol: string;
    description: string;
    logo: string;
    twitter?: string;
    website?: string;
    telegram?: string;
};
