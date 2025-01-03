import { InjectiveGrpcBase } from "../grpc/grpc-base.js";
import { DenomTrace } from "@injectivelabs/core-proto-ts/cjs/ibc/applications/transfer/v1/transfer.js";
import { PaginationOption } from "@injectivelabs/ts-types";
export function getDenomTrace(
    this: InjectiveGrpcBase,
    hash: string
): Promise<DenomTrace> {
    return this.request({
        method: this.chainGrpcIbcApi.fetchDenomTrace,
        params: hash,
    });
}

export function getDenomsTrace(
    this: InjectiveGrpcBase,
    pagination?: PaginationOption
): Promise<DenomTrace[]> {
    return this.request({
        method: this.chainGrpcIbcApi.fetchDenomsTrace,
        params: pagination || {},
    });
}
