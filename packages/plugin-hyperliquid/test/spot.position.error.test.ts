import { describe, it, expect, beforeEach } from 'vitest';
import { Action, IAgentRuntime, Memory, State, HandlerCallback, elizaLogger } from '@elizaos/core';
import { exchangeActions } from '../src/actions/exchange.actions';
import { infoActions } from '../src/actions/info.actions';
import { OrderRequest } from '../src/types/api';
import { MarginError, PositionError, OrderError } from '../src/errors';

describe('Spot Position Error Handling', () => {
    let runtime: IAgentRuntime;
    let callback: HandlerCallback;
    let message: Memory;
    let state: State;
    let lastResponse: any = null;

    beforeEach(() => {
        // Skip tests if private key is not set
        if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
            console.warn('Skipping spot tests: HYPERLIQUID_PRIVATE_KEY or HYPERLIQUID_WALLET_ADDRESS not set');
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

    describe('Position Cap and Margin Errors', () => {
        it('should handle position cap error', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            try {
                // Get current PURR price
                const getMidsAction = infoActions.find(a => a.name === 'getAllMids');
                expect(getMidsAction).toBeDefined();

                const midsResult = await getMidsAction!.handler(runtime, message, state, {}, callback);
                expect(midsResult).toBe(true);
                expect(lastResponse).toBeDefined();

                const mids = lastResponse?.content;
                const purrPrice = parseFloat(mids?.PURR || '0');
                expect(purrPrice).toBeGreaterThan(0);

                // Try to place order exceeding position cap
                const orderSize = 1000000; // Very large size to trigger cap
                const limitPrice = Math.floor(purrPrice * 100) / 100; // Round to 2 decimals
                console.log('Placing large order:', { orderSize, limitPrice, purrPrice });

                const placeOrderAction = exchangeActions.find(a => a.name === 'placeOrder');
                expect(placeOrderAction).toBeDefined();

                const orderRequest = {
                    orders: [{
                        coin: 'PURR',
                        is_buy: true,
                        sz: orderSize,
                        limit_px: limitPrice,
                        order_type: { limit: { tif: 'Gtc' } },
                        reduce_only: false
                    }]
                };

                const placeResult = await placeOrderAction!.handler(runtime, message, state, { request: orderRequest }, callback);
                const error = lastResponse?.content?.response?.data?.statuses[0]?.error;
                console.log('Position cap error:', JSON.stringify(lastResponse, null, 2));

                if (error) {
                    throw new PositionError(`Position cap exceeded: ${error}`);
                }
            } catch (error) {
                console.log('Caught error:', error);
                expect(error).toBeInstanceOf(PositionError);
                expect((error as PositionError).message).toContain('Position cap exceeded');
            }
        });

        it('should handle insufficient margin error', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            try {
                // Get current PURR price
                const getMidsAction = infoActions.find(a => a.name === 'getAllMids');
                expect(getMidsAction).toBeDefined();

                const midsResult = await getMidsAction!.handler(runtime, message, state, {}, callback);
                expect(midsResult).toBe(true);

                const mids = lastResponse?.content;
                const purrPrice = parseFloat(mids?.PURR || '0');
                expect(purrPrice).toBeGreaterThan(0);

                // Try to place order requiring more margin than available
                const orderSize = 100000; // Large size to require significant margin
                const limitPrice = Math.floor(purrPrice * 100) / 100; // Round to 2 decimals
                console.log('Placing margin-heavy order:', { orderSize, limitPrice, purrPrice });

                const placeOrderAction = exchangeActions.find(a => a.name === 'placeOrder');
                expect(placeOrderAction).toBeDefined();

                const orderRequest = {
                    orders: [{
                        coin: 'PURR',
                        is_buy: true,
                        sz: orderSize,
                        limit_px: limitPrice,
                        order_type: { limit: { tif: 'Gtc' } },
                        reduce_only: false
                    }]
                };

                const placeResult = await placeOrderAction!.handler(runtime, message, state, { request: orderRequest }, callback);
                const error = lastResponse?.content?.response?.data?.statuses[0]?.error;
                console.log('Margin error:', JSON.stringify(lastResponse, null, 2));

                if (error) {
                    throw new MarginError(`Insufficient margin: ${error}`);
                }
            } catch (error) {
                console.log('Caught error:', error);
                expect(error).toBeInstanceOf(MarginError);
                expect((error as MarginError).message).toContain('Insufficient margin');
            }
        });

        it('should handle reduce-only violation error', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            try {
                // Try to place a reduce-only order without an existing position
                // Get current price first
                const getMidsAction = infoActions.find(a => a.name === 'getAllMids');
                expect(getMidsAction).toBeDefined();

                const midsResult = await getMidsAction!.handler(runtime, message, state, {}, callback);
                expect(midsResult).toBe(true);

                const mids = lastResponse?.content;
                const purrPrice = parseFloat(mids?.PURR || '0');
                expect(purrPrice).toBeGreaterThan(0);

                const orderSize = 50;
                const limitPrice = Math.floor(purrPrice * 100) / 100; // Round to 2 decimals

                const placeOrderAction = exchangeActions.find(a => a.name === 'placeOrder');
                expect(placeOrderAction).toBeDefined();

                const orderRequest = {
                    orders: [{
                        coin: 'PURR',
                        is_buy: true,
                        sz: orderSize,
                        limit_px: limitPrice,
                        order_type: { limit: { tif: 'Gtc' } },
                        reduce_only: true // This should fail as we don't have a position to reduce
                    }]
                };

                const placeResult = await placeOrderAction!.handler(runtime, message, state, { request: orderRequest }, callback);
                const error = lastResponse?.content?.response?.data?.statuses[0]?.error;
                console.log('Reduce-only error:', JSON.stringify(lastResponse, null, 2));

                if (error) {
                    throw new OrderError(`Reduce-only violation: ${error}`);
                }

            } catch (error) {
                console.log('Caught error:', error);
                expect(error).toBeInstanceOf(OrderError);
                expect((error as OrderError).message).toContain('Reduce-only violation');
            }
        });

        it('should handle position side change error', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            try {
                // First place a buy order
                // Get current price first
                const getMidsAction = infoActions.find(a => a.name === 'getAllMids');
                expect(getMidsAction).toBeDefined();

                const midsResult = await getMidsAction!.handler(runtime, message, state, {}, callback);
                expect(midsResult).toBe(true);

                const mids = lastResponse?.content;
                const purrPrice = parseFloat(mids?.PURR || '0');
                expect(purrPrice).toBeGreaterThan(0);

                const buySize = 50;
                const buyPrice = Math.floor(purrPrice * 100) / 100; // Round to 2 decimals

                const placeOrderAction = exchangeActions.find(a => a.name === 'placeOrder');
                expect(placeOrderAction).toBeDefined();

                const buyOrderRequest = {
                    orders: [{
                        coin: 'PURR',
                        is_buy: true,
                        sz: buySize,
                        limit_px: buyPrice,
                        order_type: { limit: { tif: 'Gtc' } },
                        reduce_only: false
                    }]
                };

                await placeOrderAction!.handler(runtime, message, state, { request: buyOrderRequest }, callback);

                // Try to place a sell order that would flip position
                const sellOrderRequest = {
                    orders: [{
                        coin: 'PURR',
                        is_buy: false,
                        sz: buySize * 2, // Double size to try to flip position
                        limit_px: buyPrice,
                        order_type: { limit: { tif: 'Gtc' } },
                        reduce_only: false
                    }]
                };

                const sellResult = await placeOrderAction!.handler(runtime, message, state, { request: sellOrderRequest }, callback);
                const error = lastResponse?.content?.response?.data?.statuses[0]?.error;
                console.log('Position flip error:', JSON.stringify(lastResponse, null, 2));

                if (error) {
                    throw new PositionError(`Position side change not allowed: ${error}`);
                }

            } catch (error) {
                console.log('Caught error:', error);
                expect(error).toBeInstanceOf(PositionError);
                expect((error as PositionError).message).toContain('Position side change not allowed');
            } finally {
                // Cleanup: Cancel all open orders
                const getOrdersAction = infoActions.find(a => a.name === 'getOpenOrders');
                const cancelOrderAction = exchangeActions.find(a => a.name === 'cancelOrder');
                expect(getOrdersAction).toBeDefined();
                expect(cancelOrderAction).toBeDefined();

                const ordersResult = await getOrdersAction!.handler(runtime, message, state, {
                    address: process.env.HYPERLIQUID_WALLET_ADDRESS
                }, callback);
                expect(ordersResult).toBe(true);

                const openOrders = lastResponse?.content;
                for (const order of openOrders) {
                    if (order.coin === 'PURR') {
                        const cancelRequest = {
                            request: {
                                coin: 'PURR',
                                order_id: order.oid
                            }
                        };
                        await cancelOrderAction!.handler(runtime, message, state, cancelRequest, callback);
                        console.log(`Cleaned up order ${order.oid}`);
                    }
                }
            }
        });
    });
});