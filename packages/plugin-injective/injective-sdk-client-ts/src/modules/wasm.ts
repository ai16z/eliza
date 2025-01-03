import { InjectiveGrpcBase } from "../grpc/grpc-base.js";
import {
    ContractAccountsBalanceWithPagination,
    ContractStateWithPagination,
    ContractInfo,
    PaginationOption,
    Pagination,
    ContractCodeHistoryEntry,
    CodeInfoResponse,
} from "@injectivelabs/sdk-ts";
import { CosmwasmWasmV1Query } from "@injectivelabs/core-proto-ts";

export function getContractAccountsBalance(
    this: InjectiveGrpcBase,
    params: {
        contractAddress: string;
        pagination?: PaginationOption;
    }
): Promise<ContractAccountsBalanceWithPagination> {
    return this.request({
        method: (params: {
            contractAddress: string;
            pagination?: PaginationOption;
        }) => this.chainGrpcWasmApi.fetchContractAccountsBalance(params),
        params,
    });
}

export function getContractState(
    this: InjectiveGrpcBase,
    params: {
        contractAddress: string;
        pagination?: PaginationOption;
    }
): Promise<ContractStateWithPagination> {
    return this.request({
        method: (params: {
            contractAddress: string;
            pagination?: PaginationOption;
        }) => this.chainGrpcWasmApi.fetchContractState(params),
        params,
    });
}

export function getContractInfo(
    this: InjectiveGrpcBase,
    contractAddress: string
): Promise<ContractInfo | undefined> {
    return this.request({
        method: (params: string) =>
            this.chainGrpcWasmApi.fetchContractInfo(params),
        params: contractAddress,
    });
}

export function getContractHistory(
    this: InjectiveGrpcBase,
    contractAddress: string
): Promise<{
    entriesList: ContractCodeHistoryEntry[];
    pagination: Pagination;
}> {
    return this.request({
        method: (params: string) =>
            this.chainGrpcWasmApi.fetchContractHistory(params),
        params: contractAddress,
    });
}

export function getSmartContractState(
    this: InjectiveGrpcBase,
    params: {
        contractAddress: string;
        query?: string | Record<string, any>;
    }
): Promise<CosmwasmWasmV1Query.QuerySmartContractStateResponse> {
    return this.request({
        method: (params: {
            contractAddress: string;
            query?: string | Record<string, any>;
        }) =>
            this.chainGrpcWasmApi.fetchSmartContractState(
                params.contractAddress,
                params.query
            ),
        params,
    });
}

export function getRawContractState(
    this: InjectiveGrpcBase,
    params: {
        contractAddress: string;
        query?: string;
    }
): Promise<CosmwasmWasmV1Query.QueryRawContractStateResponse> {
    return this.request({
        method: (params: { contractAddress: string; query?: string }) =>
            this.chainGrpcWasmApi.fetchRawContractState(
                params.contractAddress,
                params.query
            ),
        params,
    });
}

export function getContractCodes(
    this: InjectiveGrpcBase,
    pagination?: PaginationOption
): Promise<{
    codeInfosList: CodeInfoResponse[];
    pagination: Pagination;
}> {
    return this.request({
        method: (params: PaginationOption) =>
            this.chainGrpcWasmApi.fetchContractCodes(params),
        params: pagination || {},
    });
}

export function getContractCode(
    this: InjectiveGrpcBase,
    codeId: number
): Promise<{
    codeInfo: CodeInfoResponse;
    data: Uint8Array;
}> {
    return this.request({
        method: (params: number) =>
            this.chainGrpcWasmApi.fetchContractCode(params),
        params: codeId,
    });
}

export function getContractCodeContracts(
    this: InjectiveGrpcBase,
    params: {
        codeId: number;
        pagination?: PaginationOption;
    }
): Promise<{
    contractsList: string[];
    pagination: Pagination;
}> {
    return this.request({
        method: (params: { codeId: number; pagination?: PaginationOption }) =>
            this.chainGrpcWasmApi.fetchContractCodeContracts(
                params.codeId,
                params.pagination
            ),
        params,
    });
}
