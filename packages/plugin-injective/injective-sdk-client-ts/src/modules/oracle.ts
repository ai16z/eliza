import { InjectiveGrpcBase } from "../grpc/grpc-base";
import { OracleModuleParams } from "@injectivelabs/sdk-ts";

export function getOracleModuleParams(
    this: InjectiveGrpcBase
): Promise<OracleModuleParams> {
    return this.request({
        method: this.chainGrpcOracleApi.fetchModuleParams,
        params: {},
    });
}
