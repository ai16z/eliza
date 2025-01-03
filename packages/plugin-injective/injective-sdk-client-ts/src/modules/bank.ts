import { PaginationOption, Coin, Pagination } from "@injectivelabs/sdk-ts";
import { Metadata } from "@injectivelabs/core-proto-ts/cjs/cosmos/bank/v1beta1/bank.js";
import { InjectiveGrpcBase } from "../grpc/grpc-base";

// Bank module chain grpc functions
export function getBankModuleParams(this: InjectiveGrpcBase) {
    return this.request({
        method: this.chainGrpcBankApi.fetchModuleParams,
        params: {},
    });
}

export function getBankBalance(
    this: InjectiveGrpcBase,
    accountAddress: string,
    denom: string
) {
    return this.request({
        method: this.chainGrpcBankApi.fetchBalance,
        params: {
            accountAddress,
            denom,
        },
    });
}

export function getBankBalances(
    this: InjectiveGrpcBase,
    address: string,
    pagination?: PaginationOption
): Promise<{
    balances: Coin[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcBankApi.fetchBalances,
        params: address,
    });
}

export function getTotalSupply(this: InjectiveGrpcBase): Promise<{
    supply: { denom: string; amount: string }[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcBankApi.fetchTotalSupply,
        params: {},
    });
}

export function getAllTotalSupply(this: InjectiveGrpcBase): Promise<{
    supply: { denom: string; amount: string }[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcBankApi.fetchAllTotalSupply,
        params: {},
    });
}

export function getSupplyOf(this: InjectiveGrpcBase, denom: string) {
    return this.request({
        method: this.chainGrpcBankApi.fetchSupplyOf,
        params: denom,
    });
}

export function getDenomsMetadata(this: InjectiveGrpcBase): Promise<{
    metadatas: Metadata[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcBankApi.fetchDenomsMetadata,
        params: {},
    });
}

export function getDenomMetadata(this: InjectiveGrpcBase, denom: string) {
    return this.request({
        method: this.chainGrpcBankApi.fetchDenomMetadata,
        params: denom,
    });
}

export function getDenomOwners(
    this: InjectiveGrpcBase,
    denom: string
): Promise<{
    denomOwners: {
        address: string;
        balance: Coin | undefined;
    }[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcBankApi.fetchDenomOwners,
        params: denom,
    });
}
