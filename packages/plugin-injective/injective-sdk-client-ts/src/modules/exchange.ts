import { InjectiveGrpcBase } from "../grpc/grpc-base.js";
import { GenesisState } from "@injectivelabs/core-proto-ts/cjs/injective/exchange/v1beta1/genesis.js";
import {
    ExchangeModuleParams,
    FeeDiscountSchedule,
    FeeDiscountAccountInfo,
    TradeRewardCampaign,
    ChainDerivativePosition,
    IsOptedOutOfRewards,
    DerivativeMarket,
    BinaryOptionsMarket,
    DerivativeLimitOrder,
    DerivativeOrderHistory,
    Position,
    PositionV2,
    DerivativeTrade,
    FundingPayment,
    FundingRate,
    TradeDirection,
    TradeExecutionSide,
    TradeExecutionType,
    PaginationOption,
    ExchangePagination,
    OrderbookWithSequence,
    TradingReward,
    SubaccountBalance,
    SubaccountTransfer,
    AccountPortfolioV2,
    AccountPortfolioBalances,
    SpotMarket,
    SpotLimitOrder,
    SpotOrderHistory,
    SpotTrade,
    AtomicSwap,
    MarketType,
    GridStrategyType,
    HistoricalBalance,
    HistoricalRPNL,
    HistoricalVolumes,
    PnlLeaderboard,
    VolLeaderboard,
    DenomHolders,
} from "@injectivelabs/sdk-ts";
import {
    InjectiveAccountRpc,
    InjectiveTradingRpc,
} from "@injectivelabs/indexer-proto-ts";

import { QuerySubaccountTradeNonceResponse } from "@injectivelabs/core-proto-ts/cjs/injective/exchange/v1beta1/query.js";
import { OrderSide, OrderState } from "@injectivelabs/ts-types";
// TODO: refactor this to take the params from ../types/index.ts
//All the chain functions go here
export function getModuleParams(
    this: InjectiveGrpcBase
): Promise<ExchangeModuleParams> {
    return this.request({
        method: this.chainGrpcExchangeApi.fetchModuleParams,
        params: {},
    });
}

export function getModuleState(this: InjectiveGrpcBase): Promise<GenesisState> {
    return this.request({
        method: this.chainGrpcExchangeApi.fetchModuleState,
        params: {},
    });
}

export function getFeeDiscountSchedule(
    this: InjectiveGrpcBase
): Promise<FeeDiscountSchedule> {
    return this.request({
        method: this.chainGrpcExchangeApi.fetchFeeDiscountSchedule,
        params: {},
    });
}

export function getFeeDiscountAccountInfo(
    this: InjectiveGrpcBase,
    injectiveAddress: string
): Promise<FeeDiscountAccountInfo> {
    return this.request({
        method: this.chainGrpcExchangeApi.fetchFeeDiscountAccountInfo,
        params: injectiveAddress,
    });
}

export function getTradingRewardsCampaign(
    this: InjectiveGrpcBase
): Promise<TradeRewardCampaign> {
    return this.request({
        method: this.chainGrpcExchangeApi.fetchTradingRewardsCampaign,
        params: {},
    });
}

export function getTradeRewardPoints(
    this: InjectiveGrpcBase,
    injectiveAddresses: string[]
): Promise<string[]> {
    return this.request({
        method: this.chainGrpcExchangeApi.fetchTradeRewardPoints,
        params: injectiveAddresses,
    });
}

export function getPendingTradeRewardPoints(
    this: InjectiveGrpcBase,
    injectiveAddresses: string[]
): Promise<string[]> {
    return this.request({
        method: this.chainGrpcExchangeApi.fetchPendingTradeRewardPoints,
        params: injectiveAddresses,
    });
}

export function getExchangePositions(
    this: InjectiveGrpcBase
): Promise<ChainDerivativePosition[]> {
    return this.request({
        method: this.chainGrpcExchangeApi.fetchPositions,
        params: {},
    });
}

export function getSubaccountTradeNonce(
    this: InjectiveGrpcBase,
    subaccountId: string
): Promise<QuerySubaccountTradeNonceResponse> {
    return this.request({
        method: this.chainGrpcExchangeApi.fetchSubaccountTradeNonce,
        params: subaccountId,
    });
}

export function getIsOptedOutOfRewards(
    this: InjectiveGrpcBase,
    account: string
): Promise<IsOptedOutOfRewards> {
    return this.request({
        method: this.chainGrpcExchangeApi.fetchIsOptedOutOfRewards,
        params: account,
    });
}

//All the indexer functions go here!
export function getDerivativeMarkets(
    this: InjectiveGrpcBase,
    quoteDenom?: string,
    marketStatus?: string,
    marketStatuses?: string[]
): Promise<DerivativeMarket[]> {
    const params = {
        quoteDenom: quoteDenom,
        marketStatus: marketStatus,
        marketStatuses: marketStatuses,
    };
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchMarkets,
        params: params || {},
    });
}

export function getDerivativeMarket(
    this: InjectiveGrpcBase,
    marketId: string
): Promise<DerivativeMarket> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchMarket,
        params: marketId,
    });
}

export function getBinaryOptionsMarkets(
    this: InjectiveGrpcBase,
    params?: {
        marketStatus?: string;
        quoteDenom?: string;
        pagination?: PaginationOption;
    }
): Promise<{
    markets: BinaryOptionsMarket[];
    pagination: {
        to: number;
        from: number;
        total: number;
        countBySubaccount: number;
        next: string[];
    };
}> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchBinaryOptionsMarkets,
        params: params || {},
    });
}

export function getBinaryOptionsMarket(
    this: InjectiveGrpcBase,
    marketId: string
): Promise<BinaryOptionsMarket> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchBinaryOptionsMarket,
        params: marketId,
    });
}

export function getDerivativeOrders(
    this: InjectiveGrpcBase,
    params?: {
        marketId?: string;
        marketIds?: string[];
        orderSide?: OrderSide;
        isConditional?: boolean;
        subaccountId?: string;
        pagination?: PaginationOption;
    }
): Promise<{
    orders: DerivativeLimitOrder[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchOrders,
        params: params || {},
    });
}

export function getDerivativeOrderHistory(
    this: InjectiveGrpcBase,
    params?: {
        subaccountId?: string;
        marketId?: string;
        marketIds?: string[];
        orderTypes?: OrderSide[];
        executionTypes?: TradeExecutionType[];
        direction?: TradeDirection;
        isConditional?: boolean;
        state?: OrderState;
        pagination?: PaginationOption;
    }
): Promise<{
    orderHistory: DerivativeOrderHistory[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchOrderHistory,
        params: params || {},
    });
}

export function getPositions(
    this: InjectiveGrpcBase,
    params?: {
        marketId?: string;
        marketIds?: string[];
        subaccountId?: string;
        direction?: TradeDirection;
        pagination?: PaginationOption;
    }
): Promise<{
    positions: Position[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchPositions,
        params: params || {},
    });
}

export function getPositionsV2(
    this: InjectiveGrpcBase,
    params?: {
        address?: string;
        marketId?: string;
        marketIds?: string[];
        subaccountId?: string;
        direction?: TradeDirection;
        pagination?: PaginationOption;
    }
): Promise<{
    positions: PositionV2[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchPositionsV2,
        params: params || {},
    });
}

export function getDerivativeTrades(
    this: InjectiveGrpcBase,
    params?: {
        endTime?: number;
        tradeId?: string;
        marketId?: string;
        startTime?: number;
        marketIds?: string[];
        subaccountId?: string;
        accountAddress?: string;
        direction?: TradeDirection;
        pagination?: PaginationOption;
        executionSide?: TradeExecutionSide;
        executionTypes?: TradeExecutionType[];
    }
): Promise<{
    trades: DerivativeTrade[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchTrades,
        params: params || {},
    });
}

export function getFundingPayments(
    this: InjectiveGrpcBase,
    params?: {
        marketId?: string;
        marketIds?: string[];
        subaccountId?: string;
        pagination?: PaginationOption;
    }
): Promise<{
    fundingPayments: FundingPayment[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchFundingPayments,
        params: params || {},
    });
}

export function getFundingRates(
    this: InjectiveGrpcBase,
    params?: {
        marketId?: string;
        pagination?: PaginationOption;
    }
): Promise<{
    fundingRates: FundingRate[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchFundingRates,
        params: params || {},
    });
}

export function getDerivativeSubaccountOrdersList(
    this: InjectiveGrpcBase,
    params?: {
        marketId?: string;
        subaccountId?: string;
        pagination?: PaginationOption;
    }
): Promise<{
    orders: DerivativeLimitOrder[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchSubaccountOrdersList,
        params: params || {},
    });
}

export function getDerivativeSubaccountTradesList(
    this: InjectiveGrpcBase,
    params: {
        marketId?: string;
        subaccountId?: string;
        direction?: TradeDirection;
        executionType?: TradeExecutionType;
        pagination?: PaginationOption;
    }
): Promise<DerivativeTrade[]> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchSubaccountTradesList,
        params,
    });
}

export function getDerivativeOrderbooksV2(
    this: InjectiveGrpcBase,
    marketIds: string[]
): Promise<
    {
        marketId: string;
        orderbook: OrderbookWithSequence;
    }[]
> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchOrderbooksV2,
        params: marketIds,
    });
}

export function getDerivativeOrderbookV2(
    this: InjectiveGrpcBase,
    marketId: string
): Promise<OrderbookWithSequence> {
    return this.request({
        method: this.indexerGrpcDerivativesApi.fetchOrderbookV2,
        params: marketId,
    });
}

export function getRewards(
    this: InjectiveGrpcBase,
    params: {
        address: string;
        epoch: number;
    }
): Promise<TradingReward[]> {
    return this.request({
        method: this.indexerGrpcAccountApi.fetchRewards,
        params,
    });
}

export function getSubaccountsList(
    this: InjectiveGrpcBase,
    address: string
): Promise<string[]> {
    return this.request({
        method: this.indexerGrpcAccountApi.fetchSubaccountsList,
        params: address,
    });
}

export function getSubaccountBalancesList(
    this: InjectiveGrpcBase,
    subaccountId: string
): Promise<SubaccountBalance[]> {
    return this.request({
        method: this.indexerGrpcAccountApi.fetchSubaccountBalancesList,
        params: subaccountId,
    });
}

export function getSubaccountHistory(
    this: InjectiveGrpcBase,
    params: {
        subaccountId: string;
        denom?: string;
        transferTypes?: string[];
        pagination?: PaginationOption;
    }
): Promise<{
    transfers: SubaccountTransfer[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcAccountApi.fetchSubaccountHistory,
        params,
    });
}

export function getSubaccountOrderSummary(
    this: InjectiveGrpcBase,
    params: {
        subaccountId: string;
        marketId?: string;
        orderDirection?: string;
    }
): Promise<InjectiveAccountRpc.SubaccountOrderSummaryResponse> {
    return this.request({
        method: this.indexerGrpcAccountApi.fetchSubaccountOrderSummary,
        params,
    });
}

export function getOrderStates(
    this: InjectiveGrpcBase,
    params?: {
        spotOrderHashes?: string[];
        derivativeOrderHashes?: string[];
    }
): Promise<InjectiveAccountRpc.OrderStatesResponse> {
    return this.request({
        method: this.indexerGrpcAccountApi.fetchOrderStates,
        params: params || {},
    });
}
export function getAccountPortfolio(
    this: InjectiveGrpcBase,
    address: string
): Promise<AccountPortfolioV2> {
    return this.request({
        method: this.indexerGrpcAccountPortfolioApi.fetchAccountPortfolio,
        params: address,
    });
}

export function getAccountPortfolioBalances(
    this: InjectiveGrpcBase,
    address: string
): Promise<AccountPortfolioBalances> {
    return this.request({
        method: this.indexerGrpcAccountPortfolioApi
            .fetchAccountPortfolioBalances,
        params: address,
    });
}

export function getSpotMarkets(
    this: InjectiveGrpcBase,
    params?: {
        baseDenom?: string;
        marketStatus?: string;
        quoteDenom?: string;
        marketStatuses?: string[];
    }
): Promise<SpotMarket[]> {
    return this.request({
        method: this.indexerGrpcSpotApi.fetchMarkets,
        params: params || {},
    });
}

export function getSpotMarket(
    this: InjectiveGrpcBase,
    marketId: string
): Promise<SpotMarket> {
    return this.request({
        method: this.indexerGrpcSpotApi.fetchMarket,
        params: marketId,
    });
}

export function getSpotOrders(
    this: InjectiveGrpcBase,
    params?: {
        marketId?: string;
        marketIds?: string[];
        subaccountId?: string;
        orderSide?: OrderSide;
        isConditional?: boolean;
        pagination?: PaginationOption;
    }
): Promise<{
    orders: SpotLimitOrder[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcSpotApi.fetchOrders,
        params: params || {},
    });
}

export function getSpotOrderHistory(
    this: InjectiveGrpcBase,
    params?: {
        subaccountId?: string;
        marketId?: string;
        marketIds?: string[];
        orderTypes?: OrderSide[];
        executionTypes?: TradeExecutionType[];
        direction?: TradeDirection;
        isConditional?: boolean;
        state?: OrderState;
        pagination?: PaginationOption;
    }
): Promise<{
    orderHistory: SpotOrderHistory[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcSpotApi.fetchOrderHistory,
        params: params || {},
    });
}

export function getSpotTrades(
    this: InjectiveGrpcBase,
    params?: {
        endTime?: number;
        tradeId?: string;
        marketId?: string;
        startTime?: number;
        marketIds?: string[];
        subaccountId?: string;
        accountAddress?: string;
        direction?: TradeDirection;
        pagination?: PaginationOption;
        executionSide?: TradeExecutionSide;
        executionTypes?: TradeExecutionType[];
    }
): Promise<{
    trades: SpotTrade[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcSpotApi.fetchTrades,
        params: params || {},
    });
}

export function getSpotSubaccountOrdersList(
    this: InjectiveGrpcBase,
    params?: {
        subaccountId?: string;
        marketId?: string;
        pagination?: PaginationOption;
    }
): Promise<{
    orders: SpotLimitOrder[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcSpotApi.fetchSubaccountOrdersList,
        params: params || {},
    });
}

export function getSpotSubaccountTradesList(
    this: InjectiveGrpcBase,
    params?: {
        subaccountId?: string;
        marketId?: string;
        direction?: TradeDirection;
        executionType?: TradeExecutionType;
        pagination?: PaginationOption;
    }
): Promise<SpotTrade[]> {
    return this.request({
        method: this.indexerGrpcSpotApi.fetchSubaccountTradesList,
        params: params || {},
    });
}

export function getSpotOrderbooksV2(
    this: InjectiveGrpcBase,
    marketIds: string[]
): Promise<
    {
        marketId: string;
        orderbook: OrderbookWithSequence;
    }[]
> {
    return this.request({
        method: this.indexerGrpcSpotApi.fetchOrderbooksV2,
        params: marketIds,
    });
}

export function getSpotOrderbookV2(
    this: InjectiveGrpcBase,
    marketId: string
): Promise<OrderbookWithSequence> {
    return this.request({
        method: this.indexerGrpcSpotApi.fetchOrderbookV2,
        params: marketId,
    });
}

export function getAtomicSwapHistory(
    this: InjectiveGrpcBase,
    params: {
        address: string;
        contractAddress: string;
        pagination?: PaginationOption;
    }
): Promise<{
    swapHistory: AtomicSwap[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: this.indexerGrpcSpotApi.fetchAtomicSwapHistory,
        params,
    });
}

export function getGridStrategies(
    this: InjectiveGrpcBase,
    params: {
        accountAddress?: string;
        subaccountId?: string;
        state?: string;
        marketId?: string;
        limit?: number;
        skip?: number;
        marketType?: MarketType;
        strategyType?: GridStrategyType[];
    }
): Promise<InjectiveTradingRpc.ListTradingStrategiesResponse> {
    return this.request({
        method: this.indexerGrpcTradingApi.fetchGridStrategies,
        params,
    });
}

export function getHistoricalBalance(
    this: InjectiveGrpcBase,
    params: {
        account: string;
        resolution: string;
    }
): Promise<HistoricalBalance> {
    return this.request({
        method: this.indexerGrpcArchiverApi.fetchHistoricalBalance,
        params,
    });
}

export function getHistoricalRpnl(
    this: InjectiveGrpcBase,
    params: {
        account: string;
        resolution: string;
    }
): Promise<HistoricalRPNL> {
    return this.request({
        method: this.indexerGrpcArchiverApi.fetchHistoricalRpnl,
        params,
    });
}

export function getHistoricalVolumes(
    this: InjectiveGrpcBase,
    params: {
        account: string;
        resolution: string;
    }
): Promise<HistoricalVolumes> {
    return this.request({
        method: this.indexerGrpcArchiverApi.fetchHistoricalVolumes,
        params,
    });
}

export function getPnlLeaderboard(
    this: InjectiveGrpcBase,
    params: {
        startDate: string;
        endDate: string;
        limit?: number;
        account?: string;
    }
): Promise<PnlLeaderboard> {
    return this.request({
        method: this.indexerGrpcArchiverApi.fetchPnlLeaderboard,
        params,
    });
}

export function getVolLeaderboard(
    this: InjectiveGrpcBase,
    params: {
        startDate: string;
        endDate: string;
        limit?: number;
        account?: string;
    }
): Promise<VolLeaderboard> {
    return this.request({
        method: this.indexerGrpcArchiverApi.fetchVolLeaderboard,
        params,
    });
}

export function getPnlLeaderboardFixedResolution(
    this: InjectiveGrpcBase,
    params: {
        resolution: string;
        limit?: number;
        account?: string;
    }
): Promise<PnlLeaderboard> {
    return this.request({
        method: this.indexerGrpcArchiverApi.fetchPnlLeaderboardFixedResolution,
        params,
    });
}

export function getVolLeaderboardFixedResolution(
    this: InjectiveGrpcBase,
    params: {
        resolution: string;
        limit?: number;
        account?: string;
    }
): Promise<VolLeaderboard> {
    return this.request({
        method: this.indexerGrpcArchiverApi.fetchVolLeaderboardFixedResolution,
        params,
    });
}

export function getDenomHolders(
    this: InjectiveGrpcBase,
    params: {
        denom: string;
        token?: string;
        limit?: number;
    }
): Promise<DenomHolders> {
    return this.request({
        method: this.indexerGrpcArchiverApi.fetchDenomHolders,
        params,
    });
}
