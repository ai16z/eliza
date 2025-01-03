import { InjectiveGrpcBase } from "../grpc/grpc-base.js";
import {
    StakingModuleParams,
    Pool,
    PaginationOption,
    Pagination,
    Validator,
    Delegation,
    UnBondingDelegation,
    ReDelegation,
} from "@injectivelabs/sdk-ts";

export function getStakingModuleParams(
    this: InjectiveGrpcBase
): Promise<StakingModuleParams> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchModuleParams,
        params: {},
    });
}

export function getPool(this: InjectiveGrpcBase): Promise<Pool> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchPool,
        params: {},
    });
}

export function getValidators(
    this: InjectiveGrpcBase,
    pagination?: PaginationOption
): Promise<{
    validators: Validator[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchValidators,
        params: pagination || {},
    });
}

export function getValidator(
    this: InjectiveGrpcBase,
    address: string
): Promise<Validator> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchValidator,
        params: address,
    });
}

export function getValidatorDelegations(
    this: InjectiveGrpcBase,
    params: {
        validatorAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    delegations: Delegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchValidatorDelegations,
        params,
    });
}

export function getValidatorDelegationsNoThrow(
    this: InjectiveGrpcBase,
    params: {
        validatorAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    delegations: Delegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchValidatorDelegationsNoThrow,
        params,
    });
}

export function getValidatorUnbondingDelegations(
    this: InjectiveGrpcBase,
    params: {
        validatorAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    unbondingDelegations: UnBondingDelegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchValidatorUnbondingDelegations,
        params,
    });
}

export function getValidatorUnbondingDelegationsNoThrow(
    this: InjectiveGrpcBase,
    params: {
        validatorAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    unbondingDelegations: UnBondingDelegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi
            .fetchValidatorUnbondingDelegationsNoThrow,
        params,
    });
}

export function getDelegation(
    this: InjectiveGrpcBase,
    params: {
        injectiveAddress: string;
        validatorAddress: string;
    }
): Promise<Delegation> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchDelegation,
        params,
    });
}

export function getDelegations(
    this: InjectiveGrpcBase,
    params: {
        injectiveAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    delegations: Delegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchDelegations,
        params,
    });
}

export function getDelegationsNoThrow(
    this: InjectiveGrpcBase,
    params: {
        injectiveAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    delegations: Delegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchDelegationsNoThrow,
        params,
    });
}

export function getDelegators(
    this: InjectiveGrpcBase,
    params: {
        validatorAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    delegations: Delegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchDelegators,
        params,
    });
}

export function getDelegatorsNoThrow(
    this: InjectiveGrpcBase,
    params: {
        validatorAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    delegations: Delegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchDelegatorsNoThrow,
        params,
    });
}

export function getUnbondingDelegations(
    this: InjectiveGrpcBase,
    params: {
        injectiveAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    unbondingDelegations: UnBondingDelegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchUnbondingDelegations,
        params,
    });
}

export function getUnbondingDelegationsNoThrow(
    this: InjectiveGrpcBase,
    params: {
        injectiveAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    unbondingDelegations: UnBondingDelegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchUnbondingDelegationsNoThrow,
        params,
    });
}

export function getReDelegations(
    this: InjectiveGrpcBase,
    params: {
        injectiveAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    redelegations: ReDelegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchReDelegations,
        params,
    });
}

export function getReDelegationsNoThrow(
    this: InjectiveGrpcBase,
    params: {
        injectiveAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    redelegations: ReDelegation[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcStakingApi.fetchReDelegationsNoThrow,
        params,
    });
}
