import type { WebSocket } from 'ws';
import type {
    Order,
    OrderRequest,
    OrderResponse,
    CancelOrderRequest,
    CancelOrderResponse,
    ClearingHouseState,
    WebSocketMessage,
    Meta,
    MetaAndAssetCtxs,
    UserFunding,
    UserNonFundingLedgerUpdates,
    FundingHistory,
    UserOpenOrders,
    UserFills,
    UserRateLimit,
    OrderStatus,
    L2Book,
    CandleSnapshot
} from './api';

export interface HyperliquidConfig {
    baseUrl: string;
    privateKey?: string;
    walletAddress: string;
    network: 'mainnet' | 'testnet';
}

export interface WebSocketConfig extends HyperliquidConfig {
    ws?: WebSocket;
}

export type {
    Order,
    OrderRequest,
    OrderResponse,
    CancelOrderRequest,
    CancelOrderResponse,
    ClearingHouseState,
    WebSocketMessage,
    Meta,
    MetaAndAssetCtxs,
    UserFunding,
    UserNonFundingLedgerUpdates,
    FundingHistory,
    UserOpenOrders,
    UserFills,
    UserRateLimit,
    OrderStatus,
    L2Book,
    CandleSnapshot
};
