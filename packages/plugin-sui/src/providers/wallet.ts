import {
    elizaLogger,
    IAgentRuntime,
    ICacheManager,
    Memory,
    Provider,
    State,
} from "@ai16z/eliza";
import BigNumber from "bignumber.js";
import NodeCache from "node-cache";
import * as path from "path";
import { SUI_DECIMALS } from "../constants";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

// Provider configuration
const PROVIDER_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
};

interface WalletPortfolio {
    totalUsd: string;
    totalSui: string;
}

interface Prices {
    sui: { usd: string };
}

export class WalletProvider {
    private cache: NodeCache;
    private cacheKey: string = "sui/wallet";

    constructor(
        private suiClient: SuiClient,
        private address: string,
        private cacheManager: ICacheManager
    ) {
        this.cache = new NodeCache({ stdTTL: 300 }); // Cache TTL set to 5 minutes
    }

    private async readFromCache<T>(key: string): Promise<T | null> {
        const cached = await this.cacheManager.get<T>(
            path.join(this.cacheKey, key)
        );
        return cached;
    }

    private async writeToCache<T>(key: string, data: T): Promise<void> {
        await this.cacheManager.set(path.join(this.cacheKey, key), data, {
            expires: Date.now() + 5 * 60 * 1000,
        });
    }

    private async getCachedData<T>(key: string): Promise<T | null> {
        // Check in-memory cache first
        const cachedData = this.cache.get<T>(key);
        if (cachedData) {
            return cachedData;
        }

        // Check file-based cache
        const fileCachedData = await this.readFromCache<T>(key);
        if (fileCachedData) {
            // Populate in-memory cache
            this.cache.set(key, fileCachedData);
            return fileCachedData;
        }

        return null;
    }

    private async setCachedData<T>(cacheKey: string, data: T): Promise<void> {
        // Set in-memory cache
        this.cache.set(cacheKey, data);
        // Write to file-based cache
        await this.writeToCache(cacheKey, data);
    }

    private async fetchPricesWithRetry() {
        let lastError: Error;

        for (let i = 0; i < PROVIDER_CONFIG.MAX_RETRIES; i++) {
            //https://dexscreener.com/sui/0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630
            //https://api.dexscreener.com/latest/dex/pairs/sui/0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630
            try {
                const cetusSuiWusdcPoolAddr =
                    "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630";
                const response = await fetch(
                    `https://api.dexscreener.com/latest/dex/pairs/sui/${cetusSuiWusdcPoolAddr}`
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(
                        `HTTP error! status: ${response.status}, message: ${errorText}`
                    );
                }

                const data = await response.json();
                return data;
            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);
                lastError = error;
                if (i < PROVIDER_CONFIG.MAX_RETRIES - 1) {
                    const delay = PROVIDER_CONFIG.RETRY_DELAY * Math.pow(2, i);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }
        }

        console.error(
            "All attempts failed. Throwing the last error:",
            lastError
        );
        throw lastError;
    }

    async fetchPortfolioValue(): Promise<WalletPortfolio> {
        try {
            const cacheKey = `portfolio-${this.address}`;
            const cachedValue =
                await this.getCachedData<WalletPortfolio>(cacheKey);

            if (cachedValue) {
                console.log("Cache hit for fetchPortfolioValue", cachedValue);
                return cachedValue;
            }
            console.log("Cache miss for fetchPortfolioValue");

            const prices = await this.fetchPrices().catch((error) => {
                console.error("Error fetching SUI price:", error);
                throw error;
            });
            const suiAmountOnChain = await this.suiClient
                .getBalance({
                    owner: this.address,
                })
                .catch((error) => {
                    console.error("Error fetching SUI amount:", error);
                    throw error;
                });

            const suiAmount = new BigNumber(suiAmountOnChain.totalBalance).div(
                new BigNumber(10).pow(SUI_DECIMALS)
            );
            const totalUsd = new BigNumber(suiAmount).times(prices.sui.usd);

            const portfolio = {
                totalUsd: totalUsd.toString(),
                totalSui: suiAmount.toString(),
            };
            this.setCachedData(cacheKey, portfolio);
            console.log("Fetched portfolio:", portfolio);
            return portfolio;
        } catch (error) {
            console.error("Error fetching portfolio:", error);
            throw error;
        }
    }

    async fetchPrices(): Promise<Prices> {
        try {
            const cacheKey = "prices";
            const cachedValue = await this.getCachedData<Prices>(cacheKey);

            if (cachedValue) {
                console.log("Cache hit for fetchPrices");
                return cachedValue;
            }
            console.log("Cache miss for fetchPrices");

            const suiPriceData = await this.fetchPricesWithRetry().catch(
                (error) => {
                    console.error("Error fetching SUI price:", error);
                    throw error;
                }
            );
            const prices: Prices = {
                sui: { usd: suiPriceData.pair.priceUsd },
            };
            this.setCachedData(cacheKey, prices);
            return prices;
        } catch (error) {
            console.error("Error fetching prices:", error);
            throw error;
        }
    }

    formatPortfolio(runtime, portfolio: WalletPortfolio): string {
        let output = `${runtime.character.name}\n`;
        output += `Wallet Address: ${this.address}\n`;

        const totalUsdFormatted = new BigNumber(portfolio.totalUsd).toFixed(2);
        const totalSuiFormatted = new BigNumber(portfolio.totalSui).toFixed(4);

        output += `Total Value: $${totalUsdFormatted} (${totalSuiFormatted} SUI)\n`;

        return output;
    }

    async getFormattedPortfolio(runtime): Promise<string> {
        try {
            const portfolio = await this.fetchPortfolioValue();
            return this.formatPortfolio(runtime, portfolio);
        } catch (error) {
            console.error("Error generating portfolio report:", error);
            return "Unable to fetch wallet information. Please try again later.";
        }
    }
}

const walletProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> => {
        const privateKey = runtime.getSetting("SUI_PRIVATE_KEY");
        const network = runtime.getSetting("SUI_NETWORK") as
            | "mainnet"
            | "testnet"
            | "devnet"
            | "localnet";

        const url = getFullnodeUrl(network);
        elizaLogger.info(`Using network: ${network}`);
        elizaLogger.info(`Using url: ${url}`);
        const pair = Ed25519Keypair.fromSecretKey(privateKey);
        const client = new SuiClient({ url });
        const address = pair.getPublicKey().toSuiAddress();
        elizaLogger.info(`Using address: ${address}`);

        try {
            const provider = new WalletProvider(
                client,
                address,
                runtime.cacheManager
            );
            return await provider.getFormattedPortfolio(runtime);
        } catch (error) {
            console.error("Error in wallet provider:", error);
            return null;
        }
    },
};

// Module exports
export { walletProvider };
