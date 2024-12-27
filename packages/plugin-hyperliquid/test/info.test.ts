import { describe, it, expect, beforeEach } from 'vitest';
import { IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { infoActions } from '../src/actions/info.actions';

describe('Info Actions', () => {
    let runtime: IAgentRuntime;
    let callback: HandlerCallback;
    let message: Memory;
    let state: State;

    beforeEach(() => {
        // Setup callback to store responses
        let lastResponse: any = null;
        callback = async (response: any) => {
            lastResponse = response;
            return [];
        };

        // Setup message and state
        message = { content: { text: '' } } as Memory;
        state = {} as State;

        // Setup runtime with environment variables
        runtime = {
            getSetting: (key: string): string | null => {
                switch (key) {
                    case 'HYPERLIQUID_PRIVATE_KEY':
                        return process.env.HYPERLIQUID_PRIVATE_KEY || null;
                    case 'HYPERLIQUID_WALLET_ADDRESS':
                        return process.env.HYPERLIQUID_WALLET_ADDRESS || null;
                    case 'HYPERLIQUID_BASE_URL':
                        return 'https://api.hyperliquid.xyz';
                    case 'HYPERLIQUID_NETWORK':
                        return 'mainnet';
                    default:
                        return null;
                }
            }
        } as IAgentRuntime;
    });

    describe('getMeta', () => {
        it('should get meta information successfully', async () => {
            const action = infoActions.find(a => a.name === 'getMeta');
            expect(action).toBeDefined();

            const result = await action!.handler(runtime, message, state, {}, callback);
            expect(result).toBe(true);
        });
    });

    describe('getAllMids', () => {
        it('should get all mids successfully', async () => {
            const action = infoActions.find(a => a.name === 'getAllMids');
            expect(action).toBeDefined();

            const result = await action!.handler(runtime, message, state, {}, callback);
            expect(result).toBe(true);
        });
    });

    describe('getMetaAndAssetCtxs', () => {
        it('should get meta and asset contexts successfully', async () => {
            const action = infoActions.find(a => a.name === 'getMetaAndAssetCtxs');
            expect(action).toBeDefined();

            const result = await action!.handler(runtime, message, state, {}, callback);
            expect(result).toBe(true);
        });
    });

    // Tests that require wallet address
    describe('User-specific info', () => {
        beforeEach(() => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                console.warn('Skipping user-specific tests: HYPERLIQUID_WALLET_ADDRESS not set');
            }
        });

        it('should get clearing house state', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            const action = infoActions.find(a => a.name === 'getClearingHouseState');
            expect(action).toBeDefined();

            const result = await action!.handler(runtime, message, state, { address: process.env.HYPERLIQUID_WALLET_ADDRESS }, callback);
            expect(result).toBe(true);
        });

        it('should get open orders', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            const action = infoActions.find(a => a.name === 'getOpenOrders');
            expect(action).toBeDefined();

            const result = await action!.handler(runtime, message, state, { address: process.env.HYPERLIQUID_WALLET_ADDRESS }, callback);
            expect(result).toBe(true);
        });

        it('should get user fills', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            const action = infoActions.find(a => a.name === 'getUserFills');
            expect(action).toBeDefined();

            const result = await action!.handler(runtime, message, state, { address: process.env.HYPERLIQUID_WALLET_ADDRESS }, callback);
            expect(result).toBe(true);
        });

        it('should get user fills by time', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            const action = infoActions.find(a => a.name === 'getUserFillsByTime');
            expect(action).toBeDefined();

            const startTime = Date.now() - 86400000; // 24 hours ago
            const result = await action!.handler(runtime, message, state, {
                address: process.env.HYPERLIQUID_WALLET_ADDRESS,
                startTime
            }, callback);
            expect(result).toBe(true);
        });

        it('should get user funding', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            const action = infoActions.find(a => a.name === 'getUserFunding');
            expect(action).toBeDefined();

            const startTime = Date.now() - 86400000; // 24 hours ago
            const result = await action!.handler(runtime, message, state, {
                address: process.env.HYPERLIQUID_WALLET_ADDRESS,
                startTime
            }, callback);
            expect(result).toBe(true);
        });

        it('should get user non-funding ledger updates', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            const action = infoActions.find(a => a.name === 'getUserNonFundingLedgerUpdates');
            expect(action).toBeDefined();

            const startTime = Date.now() - 86400000; // 24 hours ago
            const result = await action!.handler(runtime, message, state, {
                address: process.env.HYPERLIQUID_WALLET_ADDRESS,
                startTime
            }, callback);
            expect(result).toBe(true);
        });

        it('should get funding history', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            const action = infoActions.find(a => a.name === 'getFundingHistory');
            expect(action).toBeDefined();

            const startTime = Date.now() - 86400000; // 24 hours ago
            const result = await action!.handler(runtime, message, state, {
                startTime,
                coin: 'BTC'
            }, callback);
            expect(result).toBe(true);
        });
    });
});