import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { walletProvider } from "../providers/wallet"; // Your final wallet.ts
import { defaultCharacter } from "@elizaos/core";
import { chains } from "chain-registry";

// 1) Mock NodeCache so there's no actual caching side effects
vi.mock("node-cache", () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            set: vi.fn(),
            get: vi.fn().mockReturnValue(null),
        })),
    };
});

// 2) Mock path if needed
vi.mock("path", async () => {
    const actual = await vi.importActual("path");
    return {
        ...actual,
        join: vi.fn().mockImplementation((...args) => args.join("/")),
    };
});

// 3) (Optional) If you're testing price fetch from Coingecko, you can also mock fetch
vi.mock(globalThis.fetch ? "node-fetch" : "cross-fetch", () => ({
    __esModule: true,
    default: vi.fn().mockImplementation(() => ({
        ok: true,
        json: () =>
            Promise.resolve({
                osmosis: { usd: 0.9 }, // Example price for OSMO
            }),
    })),
}));

describe("Cosmos walletProvider (getFormattedPortfolio)", () => {
    let mockedRuntime: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Default runtime mock
        mockedRuntime = {
            character: defaultCharacter,
            getSetting: vi.fn(), // We override via mockImplementation per test
        };
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    it("uses environment variables for RPC, DENOM, and DECIMALS if set", async () => {
        // 4) Set environment-based overrides
        mockedRuntime.getSetting.mockImplementation((key: string) => {
            switch (key) {
                case "COSMOS_MNEMONIC":
                    return "unfold client turtle either pilot stock floor glow toward bullet car science";
                case "COSMOS_CHAIN_NAME":
                    return "osmosis";
                case "COSMOS_RPC_URL":
                    return "https://rpc.osmosis.zone/";
                case "COSMOS_CHAIN_DENOM":
                    return "uenvdenom";
                case "COSMOS_CHAIN_DECIMALS":
                    return "4";
                case "COSMOS_BECH32_PREFIX":
                    return "osmo";
                default:
                    return undefined;
            }
        });

        // 5) Execute the provider
        const result = await walletProvider.get(mockedRuntime, {} as any);

        // 6) Basic validations
        expect(result).toContain("Chain: osmosis");
        expect(result).toContain("Account Address: osmo");
        expect(result).toContain("Token Balances:");
        // Symbol uppercase => "UENVDENOM"
        expect(result).toContain("UENVDENOM");

        // "Total Value: $X.YY"
        expect(result).toMatch(/Total Value: \$[\d,]*\.\d{2}/);
    });

    it("falls back to chain-registry if env variables are not set", async () => {
        // 7) Minimal environment: just mnemonic + chain name
        mockedRuntime.getSetting.mockImplementation((key: string) => {
            switch (key) {
                case "COSMOS_MNEMONIC":
                    return "unfold client turtle either pilot stock floor glow toward bullet car science";
                case "COSMOS_CHAIN_NAME":
                    return "osmosis";
                // No COSMOS_RPC_URL, COSMOS_CHAIN_DENOM, COSMOS_CHAIN_DECIMALS
                default:
                    return undefined;
            }
        });

        // Confirm chain-registry has 'osmosis'
        const chain = chains.find((c) => c.chain_name === "osmosis");
        expect(chain).toBeDefined();

        // Execute
        const result = await walletProvider.get(mockedRuntime, {} as any);

        // Should mention chain and account address
        expect(result).toContain("Chain: osmosis");
        expect(result).toContain("Account Address:");
        // Should have "Token Balances:"
        expect(result).toContain("Token Balances:");
        // In fallback, code sets "uosmo", so symbol => "UOSMO"
        expect(result).toContain("UOSMO");
        expect(result).toMatch(/Total Value: \$[\d,]*\.\d{2}/);
    });

    it("returns null if COSMOS_MNEMONIC is not set", async () => {
        // 8) No mnemonic
        mockedRuntime.getSetting.mockImplementation((key: string) => {
            if (key === "COSMOS_CHAIN_NAME") return "osmosis";
            return undefined;
        });

        // Should throw error => provider returns null
        const result = await walletProvider.get(mockedRuntime, {} as any);
        expect(result).toBeNull();
    });
});
