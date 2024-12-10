import { erc20Abi, type PublicClient } from "viem";
import { WalletProvider } from "./wallet";
import type { SupportedChain, TokenWithBalance } from "../types";
import { Token } from "@lifi/types";

export class TokenProvider {
    constructor(private walletProvider: WalletProvider) {}

    async getTokenInfo(
        tokenAddressOrSymbol: string,
        chain: SupportedChain
    ): Promise<Token> {
        const publicClient = this.walletProvider.getPublicClient(chain);

        let tokenAddress: `0x${string}`;

        // If input is a symbol, resolve to address (you'll need to implement symbol->address mapping)
        if (!tokenAddressOrSymbol.startsWith("0x")) {
            // TODO: Implement symbol to address resolution
            throw new Error("Symbol resolution not implemented");
        } else {
            tokenAddress = tokenAddressOrSymbol as `0x${string}`;
        }

        const [name, symbol, decimals] = await Promise.all([
            publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: "name",
            }),
            publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: "symbol",
            }),
            publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: "decimals",
            }),
        ]);

        return {
            address: tokenAddress,
            chainId: this.walletProvider.getChainConfig(chain).id,
            name: name as string,
            symbol: symbol as string,
            decimals: decimals as number,
            priceUSD: "0", // TODO: Implement price fetching
        };
    }

    async getTokenBalance(
        tokenAddress: `0x${string}`,
        walletAddress: `0x${string}`,
        chain: SupportedChain
    ): Promise<TokenWithBalance> {
        const publicClient = this.walletProvider.getPublicClient(chain);
        const tokenInfo = await this.getTokenInfo(tokenAddress, chain);

        const balance = await publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [walletAddress],
        });

        const formattedBalance = this.formatBalance(
            balance as bigint,
            tokenInfo.decimals
        );

        return {
            token: tokenInfo,
            balance: balance as bigint,
            formattedBalance,
            priceUSD: tokenInfo.priceUSD,
            valueUSD: "0", // TODO: Implement value calculation
        };
    }

    async getAgentTokenBalance(
        tokenAddress: `0x${string}`
    ): Promise<TokenWithBalance> {
        const walletClient = this.walletProvider.getWalletClient();
        const agentAddress = await walletClient.account.address;
        return this.getTokenBalance(
            tokenAddress,
            agentAddress,
            this.walletProvider.getCurrentChain()
        );
    }

    private formatBalance(balance: bigint, decimals: number): string {
        const divisor = BigInt(10) ** BigInt(decimals);
        const integerPart = balance / divisor;
        const fractionalPart = balance % divisor;

        const paddedFractional = fractionalPart
            .toString()
            .padStart(decimals, "0");
        return `${integerPart}.${paddedFractional}`;
    }
}
