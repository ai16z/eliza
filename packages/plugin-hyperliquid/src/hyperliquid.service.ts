import { Service, ServiceType, elizaLogger } from "@elizaos/core";
import { HttpTransport } from './transport/http.transport';
import { WebSocketTransport } from './transport/ws.transport';
import type { HyperliquidConfig } from './types';
import { InfoType, ExchangeType } from './types/constants';
import {
    AllMids,
    UserOpenOrders,
    FrontendOpenOrders,
    UserFills,
    UserRateLimit,
    OrderStatus,
    L2Book,
    CandleSnapshot,
    Meta,
    Order,
    OrderRequest,
    OrderResponse,
    CancelOrderRequest,
    CancelOrderResponse,
    ClearingHouseState,
    MetaAndAssetCtxs,
    UserFunding,
    UserNonFundingLedgerUpdates,
    FundingHistory
} from './types/api';

function floatToWire(x: number): string {
    const rounded = x.toFixed(8);
    if (Math.abs(parseFloat(rounded) - x) >= 1e-12) {
        throw new Error(`floatToWire causes rounding: ${x}`);
    }
    let normalized = rounded.replace(/\.?0+$/, '');
    if (normalized === '-0') normalized = '0';
    return normalized;
}

function orderToWire(order: Order, assetIndex: number) {
    return {
        a: assetIndex,
        b: order.is_buy,
        p: floatToWire(order.limit_px),
        s: floatToWire(order.sz),
        r: order.reduce_only ?? false,
        t: order.order_type ?? { limit: { tif: 'Gtc' } }
    };
}

function orderWireToAction(orderWires: any[], grouping: string = 'na', builder: any = undefined) {
    return {
        type: ExchangeType.ORDER,
        orders: orderWires,
        grouping,
        ...(builder && { builder })
    };
}

export class HyperliquidService implements Service {
    private readonly httpTransport: HttpTransport;
    private readonly wsTransport: WebSocketTransport;
    private assetIndexCache = new Map<string, number>();

    public readonly serviceType = "trading" as ServiceType;

    constructor(private readonly config: HyperliquidConfig) {
        elizaLogger.info("Creating HyperliquidService instance", {
            baseUrl: config.baseUrl,
            network: config.network
        });

        this.httpTransport = new HttpTransport({
            baseUrl: config.baseUrl,
            privateKey: config.privateKey,
            walletAddress: config.walletAddress,
            isMainnet: config.network !== 'testnet'
        });
        this.wsTransport = new WebSocketTransport(config);
    }

    async initialize(): Promise<void> {
        elizaLogger.info("Initializing HyperliquidService");
        // Initialize service if needed
        // For now, we don't need any initialization
        return Promise.resolve();
    }

    private validatePublicKey(publicKey: string): void {
        if (!publicKey) {
            elizaLogger.error("Public Key validation failed: empty key provided");
            throw new Error('Public Key is required!');
        }
    }

    private async getAssetIndex(symbol: string): Promise<number> {
        let index = this.assetIndexCache.get(symbol);
        if (index === undefined) {
            elizaLogger.debug("Asset index cache miss, fetching meta data", { symbol });
            const meta = await this.getMeta();
            for (let i = 0; i < meta.universe.length; i++) {
                if (meta.universe[i].name === symbol) {
                    index = i;
                    this.assetIndexCache.set(symbol, i);
                    break;
                }
            }
        }
        if (index === undefined) {
            elizaLogger.error("Unknown asset symbol", { symbol });
            throw new Error(`Unknown asset: ${symbol}`);
        }
        return index;
    }

    async placeOrder(orderRequest: OrderRequest): Promise<OrderResponse> {
        elizaLogger.info("Placing order", { orderRequest });
        const { orders, vault_address = null, grouping = 'na', builder } = orderRequest;
        const ordersArray = orders ?? [orderRequest];

        const orderWires = await Promise.all(
            ordersArray.map(async (o) => {
                const assetIndex = await this.getAssetIndex(o.coin);
                return orderToWire(o, assetIndex);
            })
        );

        const action = orderWireToAction(orderWires, grouping, builder);
        const response = await this.httpTransport.exchangeRequest<OrderResponse>(action, vault_address);
        elizaLogger.info("Order placed successfully", { response });
        return response;
    }

    async cancelOrders(cancelRequests: CancelOrderRequest | CancelOrderRequest[]): Promise<CancelOrderResponse> {
        elizaLogger.info("Cancelling orders", { cancelRequests });
        const cancels = Array.isArray(cancelRequests) ? cancelRequests : [cancelRequests];

        const cancelsWithIndices = await Promise.all(
            cancels.map(async (req) => ({
                a: await this.getAssetIndex(req.coin),
                o: req.oid
            }))
        );

        const action = {
            type: ExchangeType.CANCEL,
            cancels: cancelsWithIndices
        };

        const response = await this.httpTransport.exchangeRequest<CancelOrderResponse>(action, null);
        elizaLogger.info("Orders cancelled successfully", { response });
        return response;
    }

    async getClearingHouseState(address: string): Promise<ClearingHouseState> {
        elizaLogger.info("Getting clearing house state", { address });
        const response = await this.httpTransport.infoRequest<ClearingHouseState>({
            type: InfoType.CLEARINGHOUSE_STATE,
            user: address
        });
        elizaLogger.debug("Received clearing house state", { response });
        return response;
    }

    async getMetaAndAssetCtxs(): Promise<MetaAndAssetCtxs> {
        elizaLogger.info("Getting meta and asset contexts");
        const response = await this.httpTransport.infoRequest<MetaAndAssetCtxs>({
            type: InfoType.PERPS_META_AND_ASSET_CTXS
        });
        elizaLogger.debug("Received meta and asset contexts", { response });
        return response;
    }

    async getUserFunding(user: string, startTime: number, endTime?: number): Promise<UserFunding> {
        elizaLogger.info("Getting user funding", { user, startTime, endTime });
        const response = await this.httpTransport.infoRequest<UserFunding>({
            type: InfoType.USER_FUNDING,
            user,
            startTime,
            endTime
        });
        elizaLogger.debug("Received user funding", { response });
        return response;
    }

    async getUserNonFundingLedgerUpdates(user: string, startTime: number, endTime?: number): Promise<UserNonFundingLedgerUpdates> {
        elizaLogger.info("Getting user non-funding ledger updates", { user, startTime, endTime });
        const response = await this.httpTransport.infoRequest<UserNonFundingLedgerUpdates>({
            type: InfoType.USER_NON_FUNDING_LEDGER_UPDATES,
            user,
            startTime,
            endTime
        });
        elizaLogger.debug("Received user non-funding ledger updates", { response });
        return response;
    }

    async getFundingHistory(coin: string, startTime: number, endTime?: number): Promise<FundingHistory> {
        elizaLogger.info("Getting funding history", { coin, startTime, endTime });
        const response = await this.httpTransport.infoRequest<FundingHistory>({
            type: InfoType.FUNDING_HISTORY,
            coin,
            startTime,
            endTime
        });
        elizaLogger.debug("Received funding history", { response });
        return response;
    }

    async getAllMids(): Promise<AllMids> {
        elizaLogger.info("Getting all mids");
        const response = await this.httpTransport.infoRequest<AllMids>({
            type: InfoType.ALL_MIDS
        });
        elizaLogger.debug("Received all mids", { response });
        return response;
    }

    async getMeta(): Promise<Meta> {
        elizaLogger.info("Getting meta information");
        const response = await this.httpTransport.infoRequest<Meta>({
            type: InfoType.META
        });
        elizaLogger.debug("Received meta information", { response });
        return response;
    }

    async getUserOpenOrders(userPublicKey: string): Promise<UserOpenOrders> {
        elizaLogger.info("Getting user open orders", { userPublicKey });
        this.validatePublicKey(userPublicKey);
        const response = await this.httpTransport.infoRequest<UserOpenOrders>({
            type: InfoType.OPEN_ORDERS,
            user: userPublicKey
        });
        elizaLogger.debug("Received user open orders", { response });
        return response || { orders: [] };
    }

    async getFrontendOpenOrders(userPublicKey: string): Promise<FrontendOpenOrders> {
        elizaLogger.info("Getting frontend open orders", { userPublicKey });
        this.validatePublicKey(userPublicKey);
        const response = await this.httpTransport.infoRequest<FrontendOpenOrders>({
            type: InfoType.FRONTEND_OPEN_ORDERS,
            user: userPublicKey
        });
        elizaLogger.debug("Received frontend open orders", { response });
        return response || { orders: [] };
    }

    async getUserFills(userPublicKey: string): Promise<UserFills> {
        elizaLogger.info("Getting user fills", { userPublicKey });
        this.validatePublicKey(userPublicKey);
        const response = await this.httpTransport.infoRequest<UserFills>({
            type: InfoType.USER_FILLS,
            user: userPublicKey
        });
        elizaLogger.debug("Received user fills", { response });
        return response || { fills: [] };
    }

    async getUserFillsByTime(userPublicKey: string, startTime: number, endTime?: number): Promise<UserFills> {
        elizaLogger.info("Getting user fills by time", { userPublicKey, startTime, endTime });
        this.validatePublicKey(userPublicKey);
        const response = await this.httpTransport.infoRequest<UserFills>({
            type: InfoType.USER_FILLS,
            user: userPublicKey,
            startTime,
            endTime
        });
        elizaLogger.debug("Received user fills by time", { response });
        return response || { fills: [] };
    }

    async getUserRateLimit(userPublicKey: string): Promise<UserRateLimit> {
        elizaLogger.info("Getting user rate limit", { userPublicKey });
        this.validatePublicKey(userPublicKey);
        const response = await this.httpTransport.infoRequest<UserRateLimit>({
            type: InfoType.USER_RATE_LIMIT,
            user: userPublicKey
        });
        elizaLogger.debug("Received user rate limit", { response });
        return response;
    }

    async getOrderStatus(params: { oid: number; coin: string }): Promise<OrderStatus> {
        elizaLogger.info("Getting order status", params);
        const response = await this.httpTransport.infoRequest<OrderStatus>({
            type: InfoType.ORDER_STATUS,
            ...params
        });
        elizaLogger.debug("Received order status", { response });
        return response;
    }

    async getL2Book(params: { coin: string }): Promise<L2Book> {
        elizaLogger.info("Getting L2 book", params);
        const response = await this.httpTransport.infoRequest<L2Book>({
            type: InfoType.L2_BOOK,
            ...params
        });
        elizaLogger.debug("Received L2 book", { response });
        return response;
    }

    async getCandleSnapshot(params: {
        coin: string;
        interval: string;
        startTime?: number;
        endTime?: number;
    }): Promise<CandleSnapshot> {
        elizaLogger.info("Getting candle snapshot", params);
        const response = await this.httpTransport.infoRequest<CandleSnapshot>({
            type: InfoType.CANDLE_SNAPSHOT,
            ...params
        });
        elizaLogger.debug("Received candle snapshot", { response });
        return response;
    }

    // WebSocket methods
    async subscribeOrderbook(coin: string): Promise<void> {
        elizaLogger.info("Subscribing to orderbook", { coin });
        await this.wsTransport.subscribe('l2Book', { coin });
        elizaLogger.debug("Successfully subscribed to orderbook", { coin });
    }

    async unsubscribeOrderbook(coin: string): Promise<void> {
        elizaLogger.info("Unsubscribing from orderbook", { coin });
        await this.wsTransport.unsubscribe('l2Book', { coin });
        elizaLogger.debug("Successfully unsubscribed from orderbook", { coin });
    }

    async closeWebSocket(): Promise<void> {
        elizaLogger.info("Closing WebSocket connection");
        await this.wsTransport.close();
        elizaLogger.debug("WebSocket connection closed successfully");
    }
}
