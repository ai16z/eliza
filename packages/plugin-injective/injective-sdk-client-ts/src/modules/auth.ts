import { Account, AuthModuleParams, Pagination } from "@injectivelabs/sdk-ts";
import { InjectiveGrpcBase } from "../grpc/grpc-base";
//include chain grpc functions here
export function getAuthModuleParams(
    this: InjectiveGrpcBase
): Promise<AuthModuleParams> {
    return this.request({
        method: this.chainGrpcAuthApi.fetchModuleParams,
        params: {},
    });
}
export function getAccountDetails(this: InjectiveGrpcBase): Promise<Account> {
    return this.request({
        method: this.chainGrpcAuthApi.fetchAccount,
        params: this.injAddress,
    });
}
export function getAccounts(this: InjectiveGrpcBase): Promise<{
    pagination: Pagination;
    accounts: Account[];
}> {
    return this.request({
        method: this.chainGrpcAuthApi.fetchAccounts,
        params: {},
    });
}
