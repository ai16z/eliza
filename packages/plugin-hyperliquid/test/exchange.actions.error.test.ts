import { describe, it, expect, beforeEach } from 'vitest';
import { Action, IAgentRuntime, Memory, State, HandlerCallback, elizaLogger } from '@elizaos/core';
import { exchangeActions } from '../src/actions/exchange.actions';
import { MarginError, PositionError, OrderError } from '../src/errors';

describe('Exchange Actions Error Handling', () => {
    let runtime: IAgentRuntime;
    let callback: HandlerCallback;
    let message: Memory;
    let state: State;
    let lastResponse: any = null;

    beforeEach(() => {
        // Skip tests if private key is not set
        if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
            console.warn('Skipping exchange tests: HYPERLIQUID_PRIVATE_KEY or HYPERLIQUID_WALLET_ADDRESS not set');
            return;
        }

        // Setup callback to store responses
        callback = (response: any) => {
            lastResponse = response;
            return Promise.resolve([]);
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

    describe('placeOrder Action', () => {
        const placeOrderAction = exchangeActions.find(a => a.name === 'placeOrder');

        it('should handle margin error correctly', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            expect(placeOrderAction).toBeDefined();

            // Try to place order requiring more margin than available
            const orderRequest = {
                orders: [{
                    coin: 'PURR',
                    is_buy: true,
                    sz: 100000, // Large size to trigger margin error
                    limit_px: 0.34,
                    order_type: { limit: { tif: 'Gtc' } },
                    reduce_only: false
                }]
            };

            const result = await placeOrderAction!.handler(runtime, message, state, { request: orderRequest }, callback);
            expect(result).toBe(false);
            expect(lastResponse.text).toContain('Failed to place order');
            expect(lastResponse.content.error).toContain('Insufficient margin');
        });

        it('should handle reduce-only error correctly', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            expect(placeOrderAction).toBeDefined();

            // Try to place reduce-only order without position
            const orderRequest = {
                orders: [{
                    coin: 'PURR',
                    is_buy: true,
                    sz: 50,
                    limit_px: 0.34,
                    order_type: { limit: { tif: 'Gtc' } },
                    reduce_only: true
                }]
            };

            const result = await placeOrderAction!.handler(runtime, message, state, { request: orderRequest }, callback);
            expect(result).toBe(false);
            expect(lastResponse.text).toContain('Failed to place order');
            expect(lastResponse.content.error).toContain('Reduce-only violation');
        });

        it('should handle missing request error', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            expect(placeOrderAction).toBeDefined();

            const result = await placeOrderAction!.handler(runtime, message, state, {}, callback);
            expect(result).toBe(false);
            expect(lastResponse.text).toContain('Failed to place order');
            expect(lastResponse.content.error).toContain('Order details are required');
        });
    });

    describe('cancelOrder Action', () => {
        const cancelOrderAction = exchangeActions.find(a => a.name === 'cancelOrder');

        it('should handle non-existent order error', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            expect(cancelOrderAction).toBeDefined();

            const cancelRequest = {
                request: {
                    coin: 'PURR',
                    order_id: 999999999 // Non-existent order ID
                }
            };

            const result = await cancelOrderAction!.handler(runtime, message, state, cancelRequest, callback);
            expect(result).toBe(false);
            expect(lastResponse.text).toContain('Failed to cancel order');
            expect(lastResponse.content.error).toContain('Order not found');
        });

        it('should handle missing request error', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            expect(cancelOrderAction).toBeDefined();

            const result = await cancelOrderAction!.handler(runtime, message, state, {}, callback);
            expect(result).toBe(false);
            expect(lastResponse.text).toContain('Failed to cancel order');
            expect(lastResponse.content.error).toContain('Cancel order request is required');
        });
    });

    describe('modifyOrder Action', () => {
        const modifyOrderAction = exchangeActions.find(a => a.name === 'modifyOrder');

        it('should handle invalid modification error', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            expect(modifyOrderAction).toBeDefined();

            // Try to modify the existing order
            const modifyRequest = {
                request: {
                    coin: 'PURR',
                    oid: 999999999, // Use a non-existent order ID to test error handling
                    is_buy: true,
                    sz: 60,
                    limit_px: 0.34,
                    order_type: { limit: { tif: 'Gtc' } },
                    reduce_only: false
                }
            };

            const result = await modifyOrderAction!.handler(runtime, message, state, modifyRequest, callback);
            expect(result).toBe(false);
            expect(lastResponse.text).toContain('Failed to modify order');
            expect(lastResponse.content.error).toContain('Order not found');
        });

        it('should handle missing request error', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            expect(modifyOrderAction).toBeDefined();

            const result = await modifyOrderAction!.handler(runtime, message, state, {}, callback);
            expect(result).toBe(false);
            expect(lastResponse.text).toContain('Failed to modify order');
            expect(lastResponse.content.error).toContain('Modify order request is required');
        });
    });
});