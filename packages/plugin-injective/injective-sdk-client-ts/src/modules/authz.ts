import {
    GrantWithDecodedAuthorization,
    GrantAuthorizationWithDecodedAuthorization,
    Pagination,
    PaginationOption,
} from "@injectivelabs/sdk-ts";
import { InjectiveGrpcBase } from "../grpc/grpc-base";
//include chain grpc functions here
export function getGrants(
    this: InjectiveGrpcBase,
    granter: string,
    grantee: string,
    pagination?: PaginationOption
): Promise<{
    pagination: Pagination;
    grants: GrantWithDecodedAuthorization[];
}> {
    return this.request({
        method: this.chainGrpcAuthZApi.fetchGrants,
        params: {
            pagination,
            granter,
            grantee,
        },
    });
}
export function getGranterGrants(
    this: InjectiveGrpcBase,
    granter: string,
    pagination?: PaginationOption
): Promise<{
    pagination: Pagination;
    grants: GrantAuthorizationWithDecodedAuthorization[];
}> {
    return this.request({
        method: this.chainGrpcAuthZApi.fetchGranterGrants,
        params: granter,
    });
}

export function getGranteeGrants(
    this: InjectiveGrpcBase,
    grantee: string,
    pagination?: PaginationOption
): Promise<{
    pagination: Pagination;
    grants: GrantAuthorizationWithDecodedAuthorization[];
}> {
    return this.request({
        method: this.chainGrpcAuthZApi.fetchGranteeGrants,
        params: grantee,
    });
}
