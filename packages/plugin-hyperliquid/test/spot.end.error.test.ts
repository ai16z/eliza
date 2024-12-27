import { describe, it, expect, beforeEach } from 'vitest';
import { Action, IAgentRuntime, Memory, State, HandlerCallback, elizaLogger } from '@elizaos/core';
import { exchangeActions } from '../src/actions/exchange.actions';
import { infoActions } from '../src/actions/info.actions';
import { OrderRequest } from '../src/types/api';

describe('Spot Trading Error Handling', () => {
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

    describe('PURR/USDC Error Cases', () => {
        it('should handle minimum order value error', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            // Get current PURR price
            const getMidsAction = infoActions.find(a => a.name === 'getAllMids');
            expect(getMidsAction).toBeDefined();

            const midsResult = await getMidsAction!.handler(runtime, message, state, {}, callback);
            expect(midsResult).toBe(true);
            expect(lastResponse).toBeDefined();

            const mids = lastResponse?.content;
            const purrPrice = parseFloat(mids?.PURR || '0');
            expect(purrPrice).toBeGreaterThan(0);

            // Try to place order below minimum value
            const orderSize = 1; // Too small
            const limitPrice = purrPrice * 0.99; // Slightly below market
            console.log('Placing small order:', { orderSize, limitPrice, purrPrice });

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
            expect(placeResult).toBe(false); // Should fail
            expect(lastResponse?.content?.error).toBeDefined(); // Check for error in response
            expect(lastResponse?.content?.error).toContain('Order Error');
        });

        it('should handle aggressive price error', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            // Get current PURR price
            const getMidsAction = infoActions.find(a => a.name === 'getAllMids');
            expect(getMidsAction).toBeDefined();

            const midsResult = await getMidsAction!.handler(runtime, message, state, {}, callback);
            expect(midsResult).toBe(true);
            expect(lastResponse).toBeDefined();

            const mids = lastResponse?.content;
            const purrPrice = parseFloat(mids?.PURR || '0');
            expect(purrPrice).toBeGreaterThan(0);

            // Try to place order with aggressive price
            const orderSize = 50;
            const limitPrice = purrPrice * 1.1; // 10% above market
            console.log('Placing aggressive order:', { orderSize, limitPrice, purrPrice });

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
            expect(placeResult).toBe(false); // Should fail
            expect(lastResponse?.content?.error).toBeDefined(); // Check for error in response
            expect(lastResponse?.content?.error).toContain('Order Error');
        });

        it('should handle cleanup after errors', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            try {
                // Place a valid order first
                const orderSize = 50;
                const limitPrice = 0.34;

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

                await placeOrderAction!.handler(runtime, message, state, { request: orderRequest }, callback);

                // Simulate an error
                throw new Error('Simulated error');

            } catch (error) {
                console.log('Caught error:', error);
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

                // Verify cleanup
                const finalOrdersResult = await getOrdersAction!.handler(runtime, message, state, {
                    address: process.env.HYPERLIQUID_WALLET_ADDRESS
                }, callback);
                expect(finalOrdersResult).toBe(true);

                const finalOrders = lastResponse?.content;
                const remainingPurrOrders = finalOrders.filter(order => order.coin === 'PURR');
                expect(remainingPurrOrders.length).toBe(0);
            }
        });
    });
});