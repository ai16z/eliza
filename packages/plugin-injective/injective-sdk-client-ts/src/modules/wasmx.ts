import { InjectiveGrpcBase } from "../grpc/grpc-base.js";
import { InjectiveWasmxV1Beta1Query } from "@injectivelabs/core-proto-ts";
import { GenesisState } from "@injectivelabs/core-proto-ts/cjs/injective/wasmx/v1/genesis.js";

export function getWasmxModuleParams(
    this: InjectiveGrpcBase
): Promise<InjectiveWasmxV1Beta1Query.QueryWasmxParamsResponse> {
    return this.request({
        method: (params: any) => this.chainGrpcWasmXApi.fetchModuleParams(),
        params: {},
    });
}

export function getWasmxModuleState(
    this: InjectiveGrpcBase
): Promise<GenesisState | undefined> {
    return this.request({
        method: (params: any) => this.chainGrpcWasmXApi.fetchModuleState(),
        params: {},
    });
}
