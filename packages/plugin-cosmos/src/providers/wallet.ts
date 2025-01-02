import { chains } from "chain-registry";
import NodeCache from "node-cache";
import BigNumber from "bignumber.js";
import { SigningStargateClient, StdFee } from "@cosmjs/stargate";
import { getOfflineSignerProto as getOfflineSigner } from "cosmjs-utils";
import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";

/** Minimal CosmosChainInfo shape */
export interface CosmosChainInfo {
    chain_name: string;
    denom?: string;
    decimals?: number;
    coingecko_id: string;
    bech32_prefix: string;
    apis?: {
        rpc?: Array<{ address: string }>;
    };
    fees?: {
        fee_tokens?: Array<{
            denom: string;
            average_gas_price?: number;
        }>;
    };
}

/** Basic token interface for the portfolio */
export interface CosmosToken {
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
    uiAmount: string;
    priceUsd: string;
    valueUsd: string;
}

/** Portfolio interface showing total USD plus an array of tokens */
interface WalletPortfolio {
    totalUsd: string;
    tokens: Array<CosmosToken>;
}

/**
 * This function now handles **all** environment overrides or
 * chain registry logic to build a final `chainInfo`.
 */
export function buildChainInfo(runtime: IAgentRuntime): CosmosChainInfo {
    // 1) Read environment or defaults
    const mnemonic = runtime.getSetting("COSMOS_MNEMONIC");
    if (!mnemonic) {
        throw new Error("COSMOS_MNEMONIC not configured");
    }

    const chainName = runtime.getSetting("COSMOS_CHAIN_NAME");
    const customRpc = runtime.getSetting("COSMOS_RPC_URL");
    const coingeckoID = runtime.getSetting("COSMOS_COINGECKO_ID");
    const customDenom = runtime.getSetting("COSMOS_CHAIN_DENOM");
    const customDecimals = Number(
        runtime.getSetting("COSMOS_CHAIN_DECIMALS") || 6
    );
    const bech32Prefix = runtime.getSetting("COSMOS_BECH32_PREFIX");

    // 2) If user provided a custom RPC, build chain info from environment.
    if (customRpc) {
        return {
            chain_name: chainName,
            bech32_prefix: bech32Prefix,
            coingecko_id: coingeckoID,
            apis: { rpc: [{ address: customRpc }] },
            denom: customDenom,
            decimals: customDecimals,
            fees: {
                fee_tokens: [
                    {
                        denom: customDenom,
                        average_gas_price: 0.025,
                    },
                ],
            },
        };
    }

    // 3) Otherwise, fallback to chain-registry
    const chainData = chains.find((c) => c.chain_name === chainName);
    if (!chainData) {
        throw new Error(`Chain '${chainName}' not found in chain-registry`);
    }

    // Use chain registry info + fallback
    const chainDenom = chainData.fees?.fee_tokens?.[0]?.denom || "uosmo";
    const chainDecimals = chainData.decimals ?? 6;
    if (!chainData.coingecko_id) {
        chainData.coingecko_id = coingeckoID;
    }
    chainData.denom = chainDenom;
    chainData.decimals = chainDecimals;

    return chainData as CosmosChainInfo;
}

/**
 * The function that connects to Cosmos chain using environment or chain registry
 * to build chain info. Returns { stargateClient, signerAddress }.
 */
export async function connectWallet(runtime: IAgentRuntime): Promise<{
    stargateClient: SigningStargateClient;
    signerAddress: string;
    chainInfo: CosmosChainInfo;
}> {
    // Ensure mnemonic
    const mnemonic = runtime.getSetting("COSMOS_MNEMONIC");
    if (!mnemonic) {
        throw new Error("COSMOS_MNEMONIC not set in environment");
    }

    // Build chain info from env or chain-registry
    const chainInfo = buildChainInfo(runtime);

    // Grab the first RPC endpoint
    const rpcUrl = chainInfo.apis?.rpc?.[0]?.address;
    if (!rpcUrl) {
        throw new Error("No RPC endpoint specified in chainInfo");
    }

    // Create offline signer
    const signer = await getOfflineSigner({
        mnemonic,
        chain: chainInfo,
    });

    // 5) Connect Stargate client
    const stargateClient = await SigningStargateClient.connectWithSigner(
        rpcUrl,
        signer
    );

    // 6) Derive address
    const [account] = await signer.getAccounts();
    const signerAddress = account.address;

    console.log(
        `connectWallet: Connected to chain '${chainInfo.chain_name}', address: ${signerAddress}`
    );

    return { stargateClient, signerAddress, chainInfo };
}

/**
 * Public method to estimate gas for a given set of messages and memo.
 * @param runtime - The agent runtime.
 * @param msgs - An array of Cosmos SDK Msg objects representing the transaction.
 * @param memo - An optional memo for the transaction.
 * @returns A StdFee object containing the estimated fee.
 */
export async function estimateGas(
    msgs: any[],
    memo: string = "",
    stargateClient: SigningStargateClient,
    signer: string,
    chainInfo: CosmosChainInfo
): Promise<StdFee> {
    try {
        // Simulate the transaction to estimate gas
        const gasEstimated = await stargateClient.simulate(signer, msgs, memo);
        console.log(`Estimated Gas: ${gasEstimated}`);

        // Apply a buffer multiplier (e.g., 1.3) to the estimated gas
        const gasWithBuffer = Math.ceil(gasEstimated * 1.3);
        console.log(`Gas with buffer (1.3x): ${gasWithBuffer}`);

        // Define the fee tokens based on chain info
        const feeDenom =
            chainInfo.fees?.fee_tokens?.[0]?.denom || chainInfo.denom;
        const averageGasPrice =
            chainInfo.fees?.fee_tokens?.[0]?.average_gas_price || 0.01;

        // Calculate the fee amount: gas * gas price
        const feeAmount = new BigNumber(gasWithBuffer)
            .multipliedBy(averageGasPrice)
            .decimalPlaces(0, BigNumber.ROUND_UP)
            .toFixed();
        console.log(`Fee Amount: ${feeAmount} ${feeDenom}`);

        // Construct the StdFee object
        const fee: StdFee = {
            amount: [
                {
                    denom: feeDenom,
                    amount: feeAmount,
                },
            ],
            gas: gasWithBuffer.toString(),
        };

        return fee;
    } catch (error) {
        console.error("Error estimating gas:", error);
        const fee: StdFee = {};
        return fee;
    }
}

/**
 * The main WalletProvider class (unchanged except we remove logic that built chainInfo).
 * We just call connectWallet(...) internally if needed.
 */
export class WalletProvider implements Provider {
    private cache: NodeCache;
    private stargateClient: SigningStargateClient | null = null;
    private signerAddress: string | null = null;

    constructor(
        private mnemonic: string,
        private chainInfo: CosmosChainInfo
    ) {
        console.log(
            "WalletProvider instantiated for chain:",
            chainInfo.chain_name
        );
        this.cache = new NodeCache({ stdTTL: 300 });
    }

    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> {
        try {
            return await this.getFormattedPortfolio(runtime);
        } catch (error) {
            console.error("Error in wallet provider get():", error);
            return null;
        }
    }

    /**
     * Connect once, storing stargateClient & signerAddress
     */
    public async connectWallet(runtime: IAgentRuntime): Promise<void> {
        if (this.stargateClient && this.signerAddress) return;

        const { stargateClient, signerAddress } = await connectWallet(runtime);
        this.stargateClient = stargateClient;
        this.signerAddress = signerAddress;
    }

    public getAddress(): string | null {
        return this.signerAddress;
    }

    async fetchPortfolioValue(
        runtime: IAgentRuntime
    ): Promise<WalletPortfolio> {
        const cacheKey = `portfolio-${this.chainInfo.chain_name}`;
        const cachedValue = this.cache.get<WalletPortfolio>(cacheKey);
        if (cachedValue) {
            console.log("Cache hit for fetchPortfolioValue");
            return cachedValue;
        }

        await this.connectWallet(runtime); // ensures stargateClient + signerAddress are set
        if (!this.stargateClient || !this.signerAddress) {
            throw new Error("Unable to fetch balances - not connected");
        }

        const denom = this.chainInfo.denom ?? "uosmo";
        const decimals = this.chainInfo.decimals ?? 6;

        const balances = await this.stargateClient.getAllBalances(
            this.signerAddress
        );
        const baseTokenBalance = balances.find((b) => b.denom === denom);
        const rawBalance = baseTokenBalance?.amount ?? "0";

        const cgID = this.chainInfo.coingecko_id || "osmosis";
        const tokenPriceUsd = await this.fetchTokenPrice(cgID);

        const convertedBalance = new BigNumber(rawBalance).shiftedBy(-decimals);
        const valueUsd = convertedBalance.multipliedBy(tokenPriceUsd).toFixed();

        const portfolio: WalletPortfolio = {
            totalUsd: valueUsd,
            tokens: [
                {
                    name: this.chainInfo.chain_name,
                    symbol: denom.toUpperCase(),
                    decimals,
                    balance: rawBalance,
                    uiAmount: convertedBalance?.toString(),
                    priceUsd: tokenPriceUsd?.toString(),
                    valueUsd,
                },
            ],
        };

        this.cache.set(cacheKey, portfolio);
        return portfolio;
    }

    private async fetchTokenPrice(cgID: string): Promise<number> {
        const cacheKey = `price-${cgID}`;
        const cachedPrice = this.cache.get<number>(cacheKey);
        if (!cachedPrice) {
            return 0;
        }

        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cgID}&vs_currencies=usd`;
            const response = await fetch(url);
            if (!response.ok) {
                console.error(
                    `Error fetching price for ${cgID}. Status: ${response.status}`
                );
                return 0;
            }

            const data = await response.json();
            const price = data[cgID]?.usd ?? 0;
            this.cache.set(cacheKey, price);
            return price;
        } catch (error) {
            console.error("Error fetching token price:", error);
            return 0;
        }
    }

    formatPortfolio(portfolio: WalletPortfolio): string {
        let output = `Chain: ${this.chainInfo.chain_name}\n`;

        if (this.signerAddress) {
            output += `Account Address: ${this.signerAddress}\n\n`;
        }

        const totalUsd = new BigNumber(portfolio.totalUsd).toFixed(2);
        output += `Total Value: $${totalUsd}\n\nToken Balances:\n`;

        for (const token of portfolio.tokens) {
            const valUsd = new BigNumber(token.valueUsd).toFixed(2);
            output += `${token.name} (${token.symbol}): ${token.uiAmount} ($${valUsd})\n`;
        }

        output += `\nMarket Prices:\n`;
        for (const token of portfolio.tokens) {
            const tokenPriceUsd = new BigNumber(token.priceUsd).toFixed(2);
            output += `${token.symbol}: $${tokenPriceUsd}\n`;
        }

        return output;
    }

    async getFormattedPortfolio(runtime: IAgentRuntime): Promise<string> {
        try {
            const portfolio = await this.fetchPortfolioValue(runtime);

            return this.formatPortfolio(portfolio);
        } catch (error) {
            console.error("Error generating portfolio report:", error);
            return "Unable to fetch wallet information. Please try again later.";
        }
    }
}

/**
 * Single exported provider (default behavior for Eliza data fetch).
 */
export const walletProvider: Provider = {
    get: async (runtime, _message, _state) => {
        try {
            // Ensure mnemonic is set
            const mnemonic = runtime.getSetting("COSMOS_MNEMONIC");
            if (!mnemonic) {
                throw new Error("COSMOS_MNEMONIC not configured");
            }

            // Build chainInfo from environment or chain registry
            const chainInfo = buildChainInfo(runtime);

            // Create a local instance of the wallet provider
            const providerInstance = new WalletProvider(mnemonic, chainInfo);

            // Return the formatted portfolio
            return providerInstance.getFormattedPortfolio(runtime);
        } catch (error) {
            console.error("Error in wallet provider:", error);
            return null;
        }
    },
};
