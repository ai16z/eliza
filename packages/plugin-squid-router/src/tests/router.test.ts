import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { defaultCharacter } from "@elizaos/core";
import { initSquidRouterProvider, SquidRouterProvider } from "../providers/squidRouter.ts";
import {ChainType} from "@0xsquid/squid-types";

// Mock Squid module
vi.mock('@0xsquid/sdk', () => {
    return {
        Squid: vi.fn().mockImplementation(() => {
            return {
                initialized: false,
                init: vi.fn().mockResolvedValue(undefined),
                getRoute: vi.fn().mockResolvedValue({}),
                executeRoute: vi.fn().mockResolvedValue({}),
                chains: [{networkName: "ethereum", chainType: ChainType.EVM, nativeCurrency: {symbol: "ETH", decimals: 18}, chainId: "1"}],
                tokens: [{symbol: "ETH", chainId: "1", address: "0x0", decimals: 18}],
            };
        })
    };
});

describe("SquidRouterProvider", () => {
    let routerProvider: SquidRouterProvider;
    let mockedRuntime;

    beforeEach(async () => {
        vi.clearAllMocks();

        mockedRuntime = {
            character: defaultCharacter,
            getSetting: vi.fn().mockImplementation((key: string) => {
                if (key === "SQUID_SDK_URL") return "test_sdk_url";
                if (key === "SQUID_INTEGRATOR_ID") return "test_integrator_id";
                //public/private key for testing
                if (key === "SQUID_EVM_PRIVATE_KEY") return "9a2bb49ab3fc4084e61a73c061b8a64041ce22ad57d8b99d938be2ac3143f2fa";
                if (key === "SQUID_EVM_ADDRESS") return "0xbb5F4ddaBbbb0AcD2086527A887b208b06A3BFdb";
                return undefined;
            }),
        };

        routerProvider = initSquidRouterProvider(mockedRuntime);
        await routerProvider.initialize();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe("Initialization", () => {
        it("should initialize the Squid SDK", async () => {
            expect(routerProvider).toBeDefined();
            expect(routerProvider.getChains()).toBeDefined();
            expect(routerProvider.getTokens()).toBeDefined();
        });
    });

    describe("getChains", () => {
        it("should return a list of chains", () => {
            const chains = routerProvider.getChains();
            expect(chains).toBeInstanceOf(Array);
        });
    });

    describe("getTokens", () => {
        it("should return a list of tokens", () => {
            const tokens = routerProvider.getTokens();
            expect(tokens).toBeInstanceOf(Array);
        });
    });

    describe("getChain", () => {
        it("should return the correct chain data for a given chain name", () => {
            const chain = routerProvider.getChain("ethereum");
            expect(chain).toBeDefined();
            expect(chain.networkName).toEqual("ethereum");
        });
    });

    describe("getToken", () => {
        it("should return the correct token data for a given chain and token symbol", () => {
            const chain = routerProvider.getChain("ethereum");
            const token = routerProvider.getToken(chain, "ETH");
            expect(token).toBeDefined();
            expect(token.symbol).toEqual("ETH");
        });
    });

    describe("getRoute", () => {
        it("should return a route response for a given route request", async () => {
            const routeRequest = {
                fromChain: "ethereum",
                toChain: "polygon",
                fromToken: "ETH",
                toToken: "MATIC",
                amount: "1",
                fromAddress: "0xYourAddress",
                toAddress: "0xRecipientAddress",
            };
            const routeResponse = await routerProvider.getRoute(routeRequest);
            expect(routeResponse).toBeDefined();
        });
    });

    describe("executeRoute", () => {
        it("should execute a route and return transaction responses", async () => {
            const executeRoute = {
                route: {
                    fromChain: "ethereum",
                    toChain: "polygon",
                    fromToken: "ETH",
                    toToken: "MATIC",
                    amount: "1",
                    fromAddress: "0xYourAddress",
                    toAddress: "0xRecipientAddress",
                },
            };
            const transactionResponses = await routerProvider.executeRoute(executeRoute);
            expect(transactionResponses).toBeDefined();
        });
    });

    describe("getEVMSignerForChain", () => {
        it("should return an EVM signer for a given chain", async () => {
            const chain = routerProvider.getChain("ethereum");
            const signer = await routerProvider.getEVMSignerForChain(chain, mockedRuntime);
            expect(signer).toBeDefined();
        });
    });
});
