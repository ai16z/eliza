import { InjectiveGrpcBase } from "../grpc/grpc-base";
import {
    ValidatorRewards,
    DistributionModuleParams,
    Coin,
} from "@injectivelabs/sdk-ts";
//All the chain grpc params go here
export function getDistributionModuleParams(
    this: InjectiveGrpcBase
): Promise<DistributionModuleParams> {
    return this.request({
        method: this.chainGrpcDistributionApi.fetchModuleParams,
        params: {},
    });
}

export function getDelegatorRewardsForValidator(
    this: InjectiveGrpcBase,
    delegatorAddress: string,
    validatorAddress: string
): Promise<Coin[]> {
    return this.request({
        method: this.chainGrpcDistributionApi.fetchDelegatorRewardsForValidator,
        params: {
            delegatorAddress,
            validatorAddress,
        },
    });
}

export function getDelegatorRewardsForValidatorNoThrow(
    this: InjectiveGrpcBase,
    delegatorAddress: string,
    validatorAddress: string
): Promise<Coin[]> {
    return this.request({
        method: this.chainGrpcDistributionApi
            .fetchDelegatorRewardsForValidatorNoThrow,
        params: {
            delegatorAddress,
            validatorAddress,
        },
    });
}

export function getDelegatorRewards(
    this: InjectiveGrpcBase,
    injectiveAddress: string
): Promise<ValidatorRewards[]> {
    return this.request({
        method: this.chainGrpcDistributionApi.fetchDelegatorRewards,
        params: injectiveAddress,
    });
}

export function getDelegatorRewardsNoThrow(
    this: InjectiveGrpcBase,
    injectiveAddress: string
): Promise<ValidatorRewards[]> {
    return this.request({
        method: this.chainGrpcDistributionApi.fetchDelegatorRewardsNoThrow,
        params: injectiveAddress,
    });
}
