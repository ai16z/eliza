import { Address } from "viem";

interface YakSwapQuote {
    amounts: bigint[];
    adapters: Address[];
    path: Address[];
    gasEstimate: bigint;
}

// struct MarketCreationParameters {
//     uint96 tokenType;
//     string name;
//     string symbol;
//     address quoteToken;
//     uint256 totalSupply;
//     uint16 creatorShare;
//     uint16 stakingShare;
//     uint256[] bidPrices;
//     uint256[] askPrices;
//     bytes args;
// }
interface TokenMillMarketCreationParameters {
    tokenType: number;
    name: string;
    symbol: string;
    quoteToken: Address;
    totalSupply: bigint;
    creatorShare: number;
    stakingShare: number;
    bidPrices: bigint[];
    askPrices: bigint[];
    args: string;
}

export type { YakSwapQuote, TokenMillMarketCreationParameters }