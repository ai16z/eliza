export const BASE_URLS = {
    PRODUCTION: 'https://api.hyperliquid.xyz',
    TESTNET: 'https://api.hyperliquid-testnet.xyz'
} as const;

export const WSS_URLS = {
    PRODUCTION: 'wss://api.hyperliquid.xyz/ws',
    TESTNET: 'wss://api.hyperliquid-testnet.xyz/ws',
};

export const ENDPOINTS = {
    INFO: 'info',
    EXCHANGE: 'exchange'
} as const;

export type OrderType = 'market' | 'limit' | 'stopLimit' | 'takeProfit' | 'postOnly' | 'fillOrKill' | 'immediateOrCancel';
export type TimeInForce = 'gtc' | 'ioc' | 'fok' | 'post';

export enum InfoType {
    ALL_MIDS = 'allMids',
    META = 'meta',
    OPEN_ORDERS = 'openOrders',
    FRONTEND_OPEN_ORDERS = 'frontendOpenOrders',
    USER_FILLS = 'userFills',
    USER_FILLS_BY_TIME = 'userFillsByTime',
    USER_RATE_LIMIT = 'userRateLimit',
    ORDER_STATUS = 'orderStatus',
    L2_BOOK = 'l2Book',
    CANDLE_SNAPSHOT = 'candleSnapshot',
    CLEARINGHOUSE_STATE = 'clearinghouseState',
    PERPS_META_AND_ASSET_CTXS = 'metaAndAssetCtxs',
    USER_FUNDING = 'userFunding',
    USER_NON_FUNDING_LEDGER_UPDATES = 'userNonFundingLedgerUpdates',
    FUNDING_HISTORY = 'fundingHistory'
}

export enum ExchangeType {
    ORDER = 'order',
    CANCEL = 'cancel',
    CANCEL_BY_CLOID = 'cancelByCloid',
    MODIFY = 'modify',
    UPDATE_LEVERAGE = 'updateLeverage',
    WITHDRAW = 'withdraw',
    TRANSFER = 'transfer'
}
