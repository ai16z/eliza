import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { WalletProvider } from "../providers/wallet";
import {
    Account,
    Aptos,
    AptosConfig,
    Ed25519PrivateKey,
    Network,
    PrivateKey,
    PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { defaultCharacter } from "@elizaos/core";
import BigNumber from "bignumber.js";
import { MOVE_DECIMALS, MOVEMENT_NETWORK_CONFIG } from "../constants";

// Mock NodeCache
vi.mock("node-cache", () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            set: vi.fn(),
            get: vi.fn().mockReturnValue(null),
        })),
    };
});

// Mock path module
vi.mock("path", async () => {
    const actual = await vi.importActual("path");
    return {
        ...actual,
        join: vi.fn().mockImplementation((...args) => args.join("/")),
    };
});

// Mock the ICacheManager
const mockCacheManager = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
    delete: vi.fn(),
};

describe("WalletProvider", () => {
    let walletProvider;
    let mockedRuntime;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCacheManager.get.mockResolvedValue(null);

        const aptosClient = new Aptos(
            new AptosConfig({
                network: Network.CUSTOM,
                fullnode: MOVEMENT_NETWORK_CONFIG.bardock.fullnode
            })
        );
        const movementAccount = Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(
                PrivateKey.formatPrivateKey(
                    // this is a test private key - DO NOT USE IN PRODUCTION
                    "0x5b4ca82e1835dcc51e58a3dec44b857edf60a26156b00f73d74bf96f5daecfb5",
                    PrivateKeyVariants.Ed25519
                )
            ),
        });

        // Create new instance of WalletProvider with Movement configuration
        walletProvider = new WalletProvider(
            aptosClient,
            movementAccount.accountAddress.toStringLong(),
            mockCacheManager
        );

        mockedRuntime = {
            character: {
                ...defaultCharacter,
                settings: {
                    secrets: {
                        MOVEMENT_PRIVATE_KEY: "0x5b4ca82e1835dcc51e58a3dec44b857edf60a26156b00f73d74bf96f5daecfb5",
                        MOVEMENT_NETWORK: "bardock"
                    }
                }
            },
        };
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe("Movement Wallet Integration", () => {
        it("should check wallet address and balance", async () => {
            const result = await walletProvider.getFormattedPortfolio(mockedRuntime);

            const prices = await walletProvider.fetchPrices();
            const moveAmountOnChain = await walletProvider.aptosClient.getAccountAPTAmount({
                accountAddress: walletProvider.address,
            });
            const moveAmount = new BigNumber(moveAmountOnChain)
                .div(new BigNumber(10).pow(MOVE_DECIMALS))
                .toFixed(4);
            const totalUsd = new BigNumber(moveAmount)
                .times(prices.move.usd)
                .toFixed(2);

            expect(result).toContain(walletProvider.address);
            expect(result).toContain(`$${totalUsd}`);
            expect(result).toContain(`${moveAmount} Move`);

            expect(result).toContain('Total Value:');
            expect(result).toContain('Wallet Address:');
        });

        it("should fetch Movement token prices", async () => {
            const prices = await walletProvider.fetchPrices();
            expect(prices).toHaveProperty("move.usd");
            expect(["string", "number"]).toContain(typeof prices.move.usd);
        });

        it("should cache wallet info", async () => {
            await walletProvider.getFormattedPortfolio(mockedRuntime);
            expect(mockCacheManager.set).toHaveBeenCalled();
        });

        it("should use cached wallet info when available", async () => {
            const cachedInfo = {
                totalUsd: "100.00",
                totalMove: "50.0000"
            };
            mockCacheManager.get.mockResolvedValueOnce(cachedInfo);

            const result = await walletProvider.getFormattedPortfolio(mockedRuntime);
            expect(result).toContain(cachedInfo.totalUsd);
            expect(result).toContain(cachedInfo.totalMove);
        });

        it("should handle network errors gracefully", async () => {
            const mockError = new Error("Network error");
            vi.spyOn(walletProvider.aptosClient, "getAccountAPTAmount").mockRejectedValueOnce(mockError);

            const result = await walletProvider.getFormattedPortfolio(mockedRuntime);
            expect(result).toBe("Unable to fetch wallet information. Please try again later.");
        });
    });
});
