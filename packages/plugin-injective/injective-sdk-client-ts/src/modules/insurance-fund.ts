import { InjectiveGrpcBase } from "../grpc/grpc-base.js";
import { InsuranceModuleParams, InsuranceFund } from "@injectivelabs/sdk-ts";

export function getInsuranceModuleParams(
    this: InjectiveGrpcBase
): Promise<InsuranceModuleParams> {
    return this.request({
        method: this.chainGrpcInsuranceFundApi.fetchModuleParams,
        params: {},
    });
}

export function getInsuranceFunds(
    this: InjectiveGrpcBase
): Promise<InsuranceFund[]> {
    return this.request({
        method: this.chainGrpcInsuranceFundApi.fetchInsuranceFunds,
        params: {},
    });
}

export function getInsuranceFund(
    this: InjectiveGrpcBase,
    marketId: string
): Promise<InsuranceFund> {
    return this.request({
        method: this.chainGrpcInsuranceFundApi.fetchInsuranceFund,
        params: marketId,
    });
}

export interface RedemptionRequest {
    marketId: string;
    address: string;
}

export interface RedemptionAmount {
    amount: string;
    denom: string;
}

export function getEstimatedRedemptions(
    this: InjectiveGrpcBase,
    params: {
        marketId: string;
        address: string;
    }
): Promise<RedemptionAmount> {
    return this.request({
        method: this.chainGrpcInsuranceFundApi.fetchEstimatedRedemptions,
        params,
    });
}

export function getPendingRedemptions(
    this: InjectiveGrpcBase,
    params: RedemptionRequest
): Promise<RedemptionAmount[]> {
    return this.request({
        method: this.chainGrpcInsuranceFundApi.fetchPendingRedemptions,
        params,
    });
}
