/**
          _____                    _____                    _____                    _____           _______                   _____          
         /\    \                  /\    \                  /\    \                  /\    \         /::\    \                 /\    \         
        /::\    \                /::\    \                /::\    \                /::\____\       /::::\    \               /:::\____\        
       /::::\    \               \:::\    \              /::::\    \              /:::/    /      /::::::\    \             /:::/    /        
      /::::::\    \               \:::\    \            /::::::\    \            /:::/    /      /::::::::\    \           /:::/   _/___      
     /:::/\:::\    \               \:::\    \          /:::/\:::\    \          /:::/    /      /:::/~~\:::\    \         /:::/   /\    \     
    /:::/__\:::\    \               \:::\    \        /:::/__\:::\    \        /:::/    /      /:::/    \:::\    \       /:::/   /::\____\    
   /::::\   \:::\    \              /::::\    \      /::::\   \:::\    \      /:::/    /      /:::/    / \:::\    \     /:::/   /:::/    /    
  /::::::\   \:::\    \    ____    /::::::\    \    /::::::\   \:::\    \    /:::/    /      /:::/____/   \:::\____\   /:::/   /:::/   _/___  
 /:::/\:::\   \:::\    \  /\   \  /:::/\:::\    \  /:::/\:::\   \:::\    \  /:::/    /      |:::|    |     |:::|    | /:::/___/:::/   /\    \ 
/:::/  \:::\   \:::\____\/::\   \/:::/  \:::\____\/:::/  \:::\   \:::\____\/:::/____/       |:::|____|     |:::|    ||:::|   /:::/   /::\____\
\::/    \:::\  /:::/    /\:::\  /:::/    \::/    /\::/    \:::\   \::/    /\:::\    \        \:::\    \   /:::/    / |:::|__/:::/   /:::/    /
 \/____/ \:::\/:::/    /  \:::\/:::/    / \/____/  \/____/ \:::\   \/____/  \:::\    \        \:::\    \ /:::/    /   \:::\/:::/   /:::/    / 
          \::::::/    /    \::::::/    /                    \:::\    \       \:::\    \        \:::\    /:::/    /     \::::::/   /:::/    /  
           \::::/    /      \::::/____/                      \:::\____\       \:::\    \        \:::\__/:::/    /       \::::/___/:::/    /   
           /:::/    /        \:::\    \                       \::/    /        \:::\    \        \::::::::/    /         \:::\__/:::/    /    
          /:::/    /          \:::\    \                       \/____/          \:::\    \        \::::::/    /           \::::::::/    /     
         /:::/    /            \:::\    \                                        \:::\    \        \::::/    /             \::::::/    /      
        /:::/    /              \:::\    \                                        \:::\____\        \::/____/               \::::/    /       
        \::/    /                \:::\____\                                        \::/    /         ~~                      \::/____/        
         \/____/                  \::/    /                                         \/____/                                   ~~              
                                  \/____/                                                                                                     
*/

import type { Hex } from './common';

/** Market information. */
export interface MarketInfo {
    /** Asset ID. */
    assetId: number;

    /** Asset symbol. */
    symbol: string;

    /** Base asset (e.g., BTC). */
    baseAsset: string;

    /** Quote asset (e.g., USD). */
    quoteAsset: string;

    /** Market status. */
    status: 'active' | 'inactive';

    /** Minimum leverage. */
    minLeverage: number;

    /** Maximum leverage. */
    maxLeverage: number;

    /** Step size for order quantity. */
    stepSize: string;

    /** Tick size for order price. */
    tickSize: string;

    /** Minimum order quantity. */
    minQuantity: string;

    /** Maximum order quantity. */
    maxQuantity: string;

    /** Initial margin requirement. */
    imr: string;

    /** Maintenance margin requirement. */
    mmr: string;

    /** Current funding rate. */
    fundingRate: string;
}

/** Orderbook entry. */
export interface OrderbookEntry {
    /** Price level. */
    p: string;

    /** Size at this level. */
    s: string;
}

/** Orderbook data. */
export interface Orderbook {
    /** Asset ID. */
    asset: number;

    /** Timestamp. */
    time: number;

    /** Asks (sell orders). */
    asks: OrderbookEntry[];

    /** Bids (buy orders). */
    bids: OrderbookEntry[];
}

/** Trade data. */
export interface Trade {
    /** Asset ID. */
    asset: number;

    /** Trade ID. */
    tid: number;

    /** Price. */
    px: string;

    /** Size. */
    sz: string;

    /** Position side (true for long, false for short). */
    side: boolean;

    /** Timestamp. */
    time: number;

    /** Liquidation flag. */
    liq: boolean;

    /** Fill mark price. */
    fillMark: string;

    /** Taker order ID. */
    takerOid: number;

    /** Maker order ID. */
    makerOid: number;

    /** Taker Client Order ID. */
    takerCloid?: Hex;

    /** Maker Client Order ID. */
    makerCloid?: Hex;
}

/** Ticker data. */
export interface Ticker {
    /** Asset ID. */
    asset: number;

    /** Last trade price. */
    last: string;

    /** Best bid price. */
    bid: string;

    /** Best ask price. */
    ask: string;

    /** 24h high price. */
    high24h: string;

    /** 24h low price. */
    low24h: string;

    /** 24h volume in base currency. */
    baseVolume24h: string;

    /** 24h volume in quote currency. */
    quoteVolume24h: string;

    /** Current funding rate. */
    fundingRate: string;

    /** Next funding time. */
    nextFundingTime: number;

    /** Mark price. */
    markPrice: string;

    /** Index price. */
    indexPrice: string;

    /** Open interest in base currency. */
    openInterest: string;
}

/** Market data subscription channel. */
export type MarketChannel = 'orderbook' | 'trades' | 'ticker' | 'candles';

/** Market data subscription message. */
export interface MarketDataMessage {
    /** Channel name. */
    channel: MarketChannel;

    /** Asset ID. */
    asset: number;

    /** Data payload. */
    data: Orderbook | Trade | Ticker;
}
