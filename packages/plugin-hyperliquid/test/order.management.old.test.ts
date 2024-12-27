import { describe, it, expect, beforeEach } from 'vitest';
import { Action, IAgentRuntime, Memory, State, HandlerCallback, elizaLogger } from '@elizaos/core';
import { exchangeActions } from '../src/actions/exchange.actions';
import { OrderError } from '../src/errors';
import { HyperliquidService } from '../src/hyperliquid.service';

async function getService(runtime: IAgentRuntime): Promise<HyperliquidService> {
    const privateKey = runtime.getSetting('HYPERLIQUID_PRIVATE_KEY');
    const walletAddress = runtime.getSetting('HYPERLIQUID_WALLET_ADDRESS');
    const baseUrl = runtime.getSetting('HYPERLIQUID_BASE_URL') || 'https://api.hyperliquid.xyz';
    const network = runtime.getSetting('HYPERLIQUID_NETWORK') || 'mainnet';

    if (!privateKey || !walletAddress) {
        throw new Error('HYPERLIQUID_PRIVATE_KEY and HYPERLIQUID_WALLET_ADDRESS must be set');
    }

    return new HyperliquidService({
        baseUrl,
        privateKey,
        walletAddress,
        network: network as 'mainnet' | 'testnet'
    });
}

describe('Order Management', () => {
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

    describe('List and Cancel Orders', () => {
        it('should list and cancel all open orders', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            // Get the service to list orders
            const service = await getService(runtime);
            const openOrders = await service.getUserOpenOrders(process.env.HYPERLIQUID_WALLET_ADDRESS);
            console.log('Current open orders:', JSON.stringify(openOrders, null, 2));

            // Cancel any existing orders
            if (openOrders && openOrders.orders && openOrders.orders.length > 0) {
                const cancelOrderAction = exchangeActions.find(a => a.name === 'cancelOrder');
                expect(cancelOrderAction).toBeDefined();

                for (const order of openOrders.orders) {
                    const cancelRequest = {
                        request: {
                            coin: order.coin,
                            order_id: order.oid
                        }
                    };

                    const cancelResult = await cancelOrderAction!.handler(runtime, message, state, cancelRequest, callback);
                    expect(cancelResult).toBe(true);
                    expect(lastResponse.text).toContain('Successfully cancelled order');
                    console.log(`Cancelled order ${order.oid} for ${order.coin}`);

                    // Verify the specific order is cancelled
                    const updatedOrders = await service.getUserOpenOrders(process.env.HYPERLIQUID_WALLET_ADDRESS);
                    const orderStillExists = updatedOrders.orders?.some(o => o.oid === order.oid);
                    expect(orderStillExists).toBe(false);
                }
            }
        });

        it('should cancel specific order', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY || !process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            // First verify if the order exists
            const service = await getService(runtime);
            const openOrders = await service.getUserOpenOrders(process.env.HYPERLIQUID_WALLET_ADDRESS);
            console.log('Current open orders:', JSON.stringify(openOrders, null, 2));

            const orderExists = openOrders.orders?.some(o => o.oid === 58919211671);
            if (!orderExists) {
                console.log('Order 58919211671 does not exist, skipping test');
                return;
            }

            const cancelOrderAction = exchangeActions.find(a => a.name === 'cancelOrder');
            expect(cancelOrderAction).toBeDefined();

            // Cancel the specific order
            const cancelRequest = {
                request: {
                    coin: 'PURR',
                    order_id: 58919211671
                }
            };

            const cancelResult = await cancelOrderAction!.handler(runtime, message, state, cancelRequest, callback);
            expect(cancelResult).toBe(true);
            expect(lastResponse.text).toContain('Successfully cancelled order');
            console.log('Cancelled order 58919211671 for PURR');

            // Verify the order is cancelled
            const updatedOrders = await service.getUserOpenOrders(process.env.HYPERLIQUID_WALLET_ADDRESS);
            console.log('Remaining open orders:', JSON.stringify(updatedOrders, null, 2));
            const orderStillExists = updatedOrders.orders?.some(o => o.oid === 58919211671);
            expect(orderStillExists).toBe(false);
        });
    });
});