import { InjectiveGrpcBase } from "../grpc/grpc-base";
import { PeggyModuleParams } from "@injectivelabs/sdk-ts";

export function getPeggyModuleParams(
    this: InjectiveGrpcBase
): Promise<PeggyModuleParams> {
    return this.request({
        method: this.chainGrpcPeggyApi.fetchModuleParams,
        params: {},
    });
}
