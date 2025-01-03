import {
    AuctionModuleStateParams,
    AuctionModuleState,
    CurrentBasket,
    Auction,
} from "@injectivelabs/sdk-ts";
import { InjectiveGrpcBase } from "../grpc/grpc-base";
//include chain grpc calls for fetch functions
export function getAuctionModuleParams(
    this: InjectiveGrpcBase
): Promise<AuctionModuleStateParams> {
    return this.request({
        method: this.chainGrpcAuctionApi.fetchModuleParams,
        params: {},
    });
}
export function getAuctionModuleState(
    this: InjectiveGrpcBase
): Promise<AuctionModuleState> {
    return this.request({
        method: this.chainGrpcAuctionApi.fetchModuleState,
        params: {},
    });
}

export function getCurrentBasket(
    this: InjectiveGrpcBase
): Promise<CurrentBasket> {
    return this.request({
        method: this.chainGrpcAuctionApi.fetchCurrentBasket,
        params: {},
    });
}
//include indexer grpc calls
export function getAuctionRound(
    this: InjectiveGrpcBase,
    round: number
): Promise<Auction> {
    return this.query({
        method: this.indexerGrpcAuctionApi.fetchAuction,
        params: round,
    });
}

export function getAuctions(
    this: InjectiveGrpcBase,
    startRound: number,
    limit: number
): Promise<Auction[]> {
    return this.query({
        method: this.indexerGrpcAuctionApi.fetchAuctions,
        params: { startRound, limit },
    });
}
