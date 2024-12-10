import {
    IAgentRuntime,
    Memory,
    State,
    ModelClass,
    composeContext,
    generateObject
} from "@ai16z/eliza";
import { WalletProvider } from "../providers/wallet";
import { SupportedChain } from "../types";
import { getTokenMarketDataTemplate } from "../templates/getTokenMarketData";

interface TokenMarketDataParams {
    chain: SupportedChain;
    tokenAddress: `0x${string}`;
    timeframe?: "24h" | "7d" | "30d";
}

interface PriceDataPoint {
    timestamp: number;
    price: number;
    volume: number;
}

interface OrderFlowData {
    buys: number;
    sells: number;
    buyVolume: number;
    sellVolume: number;
    largestTrade: {
        type: "buy" | "sell";
        amount: number;
        priceUSD: number;
        timestamp: number;
    };
}

interface TokenMarketData {
    priceHistory: PriceDataPoint[];
    orderFlow: OrderFlowData;
    currentPrice: number;
    priceChange24h: number;
    volume24h: number;
}

export const getTokenMarketDataAction = {
    name: "gettokenmarketdata",
    description: "Get historical price action and order flow data for an ERC20 token",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory | null,
        state: State | null,
        options: any
    ): Promise<TokenMarketData> => {
        try {
            const params = options.skipParsing ? options : await generateObject({
                runtime,
                context: composeContext({ state, template: getTokenMarketDataTemplate }),
                modelClass: ModelClass.LARGE
            });

            const timeframe = params.timeframe || "24h";

            // Convert timeframe to Unix timestamp
            const now = Math.floor(Date.now() / 1000);
            const timeframeMap = {
                "24h": now - 86400,
                "7d": now - 604800,
                "30d": now - 2592000
            };
            const startTime = timeframeMap[timeframe];

            // Fetch price history from CoinGecko
            const cgResponse = await fetch(
                `https://api.coingecko.com/api/v3/coins/${params.chain}/contract/${params.tokenAddress}/market_chart/range?vs_currency=usd&from=${startTime}&to=${now}`
            );
            const cgData = await cgResponse.json();

            // Process price history data
            const priceHistory: PriceDataPoint[] = cgData.prices.map((item: [number, number], index: number) => ({
                timestamp: Math.floor(item[0] / 1000),
                price: item[1],
                volume: cgData.total_volumes[index]?.[1] || 0
            }));

            // Get order flow data from a DEX API (example using Etherscan API for Ethereum)
            let orderFlow: OrderFlowData = {
                buys: 0,
                sells: 0,
                buyVolume: 0,
                sellVolume: 0,
                largestTrade: {
                    type: "buy",
                    amount: 0,
                    priceUSD: 0,
                    timestamp: 0
                }
            };

            if (params.chain === "ethereum") {
                const etherscanKey = runtime.getSetting("ETHERSCAN_API_KEY");
                if (etherscanKey) {
                    const txResponse = await fetch(
                        `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${params.tokenAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanKey}`
                    );
                    const txData = await txResponse.json();

                    if (txData.status === "1") {
                        // Process transaction data to calculate order flow
                        orderFlow = processTransactions(txData.result, startTime);
                    }
                }
            }

            // Calculate current metrics
            const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0;
            const startPrice = priceHistory[0]?.price || 0;
            const priceChange24h = ((currentPrice - startPrice) / startPrice) * 100;
            const volume24h = priceHistory.reduce((sum, point) => sum + point.volume, 0);

            return {
                priceHistory,
                orderFlow,
                currentPrice,
                priceChange24h,
                volume24h
            };
        } catch (error) {
            console.error("Error in getTokenMarketData handler:", error);
            throw error;
        }
    },
    template: getTokenMarketDataTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me USDC price history on Ethereum for the last 7 days",
                    action: "GET_TOKEN_MARKET_DATA",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "What's the trading activity for USDC on Base in the last 24 hours?",
                    action: "GET_TOKEN_MARKET_DATA",
                },
            },
        ],
    ],
    similes: ["GET_TOKEN_MARKET_DATA", "TOKEN_PRICE_HISTORY", "TOKEN_TRADING_DATA", "ORDER_FLOW"],
};

function processTransactions(transactions: any[], startTime: number): OrderFlowData {
    let orderFlow: OrderFlowData = {
        buys: 0,
        sells: 0,
        buyVolume: 0,
        sellVolume: 0,
        largestTrade: {
            type: "buy",
            amount: 0,
            priceUSD: 0,
            timestamp: 0
        }
    };

    // Process each transaction
    transactions.forEach(tx => {
        if (tx.timeStamp < startTime) return;

        const value = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));

        if (tx.to.toLowerCase() === tx.contractAddress.toLowerCase()) {
            // This is a buy
            orderFlow.buys++;
            orderFlow.buyVolume += value;

            if (value > orderFlow.largestTrade.amount) {
                orderFlow.largestTrade = {
                    type: "buy",
                    amount: value,
                    priceUSD: 0, // Would need price data at that timestamp
                    timestamp: parseInt(tx.timeStamp)
                };
            }
        } else {
            // This is a sell
            orderFlow.sells++;
            orderFlow.sellVolume += value;

            if (value > orderFlow.largestTrade.amount) {
                orderFlow.largestTrade = {
                    type: "sell",
                    amount: value,
                    priceUSD: 0, // Would need price data at that timestamp
                    timestamp: parseInt(tx.timeStamp)
                };
            }
        }
    });

    return orderFlow;
}