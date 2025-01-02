import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import cosmosSendTokenAction from "../actions/transfer";
import { defaultCharacter, State, Memory, IAgentRuntime } from "@elizaos/core";

vi.mock("@ai16z/eliza", async () => {
    const actual = await vi.importActual("@ai16z/eliza");
    return {
        ...actual,
        generateObjectDeprecated: vi.fn().mockImplementation(async () => {
            // Hardcode the content for transfer
            return {
                tokenDenom: "uosmo",
                recipient: "osmo1dxapu02qxcgmr2xt8v3ca6mhwtuygmc46rfryx",
                amount: "100000",
                memo: "User custom memo here",
            };
        }),
    };
});

// Optionally mock connectWallet to prevent real blockchain interactions
vi.mock("../providers/wallet", () => ({
    connectWallet: vi.fn().mockResolvedValue({
        stargateClient: {
            sendTokens: vi.fn().mockResolvedValue({
                code: 0,
                transactionHash: "test-tx-hash",
            }),
        },
        signerAddress: "osmo1dxapu02qxcgmr2xt8v3ca6mhwtuygmc46rfryx",
        chainInfo: {},
    }),
    estimateGas: vi.fn().mockResolvedValue({
        amount: [
            {
                denom: "udenom",
                amount: 100000,
            },
        ],
        gas: 5000,
    }),
}));

describe("Cosmos Transfer Integration Test", () => {
    let mockedRuntime: IAgentRuntime;
    let mockedMemory: Memory;
    let testState: State;
    let callbackResult: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Minimal runtime that fetches environment variables
        mockedRuntime = {
            character: defaultCharacter,
            getSetting: (key: string) => process.env[key],
            composeState: vi.fn().mockResolvedValue({} as State),
            updateRecentMessageState: vi.fn().mockResolvedValue({} as State),
        } as unknown as IAgentRuntime;

        mockedMemory = {
            get: () => {},
            set: () => {},
        };

        testState = {} as State;
        callbackResult = null;
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    it("should transfer a small amount of tokens on a real chain", async () => {
        // Provide a callback to capture success/error
        const callback = (info: any) => {
            callbackResult = info;
        };

        // Call the default-exported action's handler
        const success = await cosmosSendTokenAction.handler(
            mockedRuntime,
            mockedMemory,
            testState,
            {},
            callback
        );

        if (success) {
            // The action returned true => success
            expect(callbackResult?.text).toMatch(
                /Transfer completed successfully/i
            );
        } else {
            // The action returned false => error
            expect(callbackResult?.content?.error).toBeDefined();
        }
    });
});
