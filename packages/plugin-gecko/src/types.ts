export interface CoinListEntry {
    id: string;
    symbol: string;
    name: string;
}

export interface PriceResponse {
    [key: string]: {
        usd: number;
        usd_market_cap: number;
    };
}
