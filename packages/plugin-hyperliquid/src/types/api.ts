import { ExchangeType } from './constants';

export interface Signature {
    r: string;
    s: string;
    v: number;
}

export interface Order {
    coin: string;
    is_buy: boolean;
    sz: number;
    limit_px: number;
    reduce_only?: boolean;
    order_type?: {
        limit: {
            tif: 'Gtc' | 'Ioc' | 'Alo';
        };
    };
}

export interface OrderRequest {
    coin: string;
    is_buy: boolean;
    sz: number;
    limit_px: number;
    reduce_only?: boolean;
    order_type?: {
        limit: {
            tif: 'Gtc' | 'Ioc' | 'Alo';
        };
    };
    orders?: Order[];
    vault_address?: string | null;
    grouping?: string;
    builder?: any;
}

export interface OrderResponse {
    status: string;
    response: {
        type: ExchangeType;
        data: {
            statuses: Array<{
                filled?: {
                    totalSz: string;
                    avgPx: string;
                    oid: number;
                };
                error?: string;
            }>;
        };
    };
}

export interface CancelOrderRequest {
    coin: string;
    oid: number;
}

export interface CancelOrderResponse {
    status: string;
    response: {
        type: ExchangeType;
        data: {
            statuses: Array<{
                error?: string;
            }>;
        };
    };
}

export interface AllMids {
    [key: string]: string;
}

export interface UserOpenOrders {
    orders: Array<{
        coin: string;
        side: 'B' | 'S';
        limitPx: string;
        sz: string;
        oid: number;
        timestamp: number;
        origSz: string;
    }>;
}

export interface FrontendOpenOrders {
    orders: Array<{
        coin: string;
        is_buy: boolean;
        sz: string;
        limit_px: string;
        order_id: number;
        timestamp: number;
        status: string;
    }>;
}

export interface UserFills {
    fills: Array<{
        coin: string;
        is_buy: boolean;
        sz: string;
        px: string;
        order_id: number;
        timestamp: number;
        fee: string;
    }>;
}

export interface UserRateLimit {
    remaining: number;
    reset: number;
}

export interface OrderStatus {
    status: string;
    filled_sz: string;
    remaining_sz: string;
    avg_px: string;
    order_id: number;
    timestamp: number;
}

export interface L2Book {
    coin: string;
    timestamp: number;
    bids: Array<[string, string, number]>;
    asks: Array<[string, string, number]>;
}

export interface CandleSnapshot {
    coin: string;
    interval: string;
    candles: Array<{
        timestamp: number;
        open: string;
        high: string;
        low: string;
        close: string;
        volume: string;
    }>;
}

export interface Meta {
    universe: Array<{
        name: string;
        szDecimals: number;
        pxDecimals: number;
    }>;
}

export interface WebSocketMessage {
    type: string;
    channel: string;
    data?: any;
    [key: string]: any;
}

export interface AssetPosition {
    coin: string;
    position: string;
    entryPrice: string;
    liquidationPrice?: string;
    unrealizedPnl: string;
}

export interface MarginSummary {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
}

export interface ClearingHouseState {
    marginSummary: MarginSummary;
    crossMarginSummary: MarginSummary;
    crossMaintenanceMarginUsed: string;
    withdrawable: string;
    assetPositions: AssetPosition[];
    time: number;
}

export interface FundingRate {
    coin: string;
    timestamp: number;
    rate: string;
}

export interface FundingHistory {
    history: FundingRate[];
}

export interface UserFunding {
    funding: Array<{
        coin: string;
        timestamp: number;
        amount: string;
        position: string;
        fundingRate: string;
    }>;
}

export interface LedgerUpdate {
    coin: string;
    timestamp: number;
    amount: string;
    type: string;
    details: string;
}

export interface UserNonFundingLedgerUpdates {
    updates: LedgerUpdate[];
}

export interface MetaAndAssetCtxs {
    meta: Meta;
    assetCtxs: Array<{
        name: string;
        openInterest: string;
        dayNtlVlm: string;
        funding: string;
        lastPrice: string;
        markPrice: string;
    }>;
}

export interface L1Action {
    type: string;
    data: Record<string, unknown>;
}

export type L1ActionType = {
    type: string;
    data: Record<string, unknown>;
};
