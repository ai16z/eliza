import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Action, IAgentRuntime, Memory, State, HandlerCallback, elizaLogger } from '@elizaos/core';
import { wsActions } from '../../src/actions/ws.actions';
import type { L2Book, WebSocketMessage } from '../../src/types/api';
import { WebSocketTransport } from '../../src/transport/ws.transport';

describe('WebSocket Actions Integration', () => {
    let runtime: IAgentRuntime;
    let callback: HandlerCallback;
    let agentMessage: Memory;
    let state: State;

    beforeEach(() => {
        elizaLogger.debug('=== Test Setup Starting ===');
        // Skip tests if wallet address is not set
        if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
            elizaLogger.warn('Skipping tests: HYPERLIQUID_WALLET_ADDRESS not set');
            return;
        }

        // Setup message and state
        agentMessage = { content: { text: '' } } as Memory;
        state = {} as State;
        elizaLogger.debug('Runtime state initialized:', {
            hasState: !!state,
            stateKeys: Object.keys(state)
        });

        // Setup runtime with environment variables
        runtime = {
            getSetting: (key: string): string | null => {
                const value = {
                    'HYPERLIQUID_WALLET_ADDRESS': process.env.HYPERLIQUID_WALLET_ADDRESS || null,
                    'HYPERLIQUID_BASE_URL': 'https://api.hyperliquid.xyz',
                    'HYPERLIQUID_NETWORK': 'mainnet'
                }[key] || null;
                elizaLogger.debug(`Runtime setting requested: ${key} = ${value}`);
                return value;
            }
        } as IAgentRuntime;
        elizaLogger.debug('=== Test Setup Complete ===');
    });

    afterEach(async () => {
        elizaLogger.debug('=== Test Cleanup Starting ===');
        // Clean up WebSocket connection if it exists
        if ((state as any).wsTransport instanceof WebSocketTransport) {
            elizaLogger.debug('Cleaning up existing WebSocket transport');
            await (state as any).wsTransport.close();
            elizaLogger.debug('WebSocket transport closed');
        }
        elizaLogger.debug('=== Test Cleanup Complete ===');
    });

    describe('subscription management', () => {
        it('should subscribe and unsubscribe from orderbook', async () => {
            elizaLogger.debug('=== Starting Subscribe/Unsubscribe Test ===');
            const subscribeAction = wsActions.find(a => a.name === 'subscribeOrderbook');
            const unsubscribeAction = wsActions.find(a => a.name === 'unsubscribeOrderbook');
            elizaLogger.debug('Actions found:', {
                hasSubscribe: !!subscribeAction,
                hasUnsubscribe: !!unsubscribeAction
            });

            expect(subscribeAction).toBeDefined();
            expect(unsubscribeAction).toBeDefined();

            // Create a promise that will resolve when we receive the orderbook
            const messagePromise = new Promise<L2Book>((resolve) => {
                callback = (response: any) => {
                    elizaLogger.debug('Callback received response:', {
                        type: response.content?.type,
                        coin: response.content?.coin,
                        hasContent: !!response.content
                    });
                    if (response.content?.type === 'l2Book') {
                        elizaLogger.debug('Resolving l2Book message');
                        resolve(response.content as L2Book);
                    }
                    return Promise.resolve([]);
                };
            });

            // Subscribe to HYPE orderbook
            elizaLogger.debug('Attempting to subscribe to HYPE orderbook');
            const subscribeResult = await subscribeAction!.handler(runtime, agentMessage, state, { coin: 'HYPE' }, callback);
            elizaLogger.debug('Subscribe result:', { success: subscribeResult });
            expect(subscribeResult).toBe(true);

            // Wait for first message with timeout
            elizaLogger.debug('Waiting for orderbook message');
            const orderbook = await Promise.race([
                messagePromise,
                new Promise<never>((_, reject) => {
                    elizaLogger.debug('Starting timeout for orderbook message');
                    setTimeout(() => {
                        elizaLogger.error('Timeout waiting for orderbook message');
                        reject(new Error('Timeout waiting for orderbook message'));
                    }, 30000);
                })
            ]);

            elizaLogger.debug('Received orderbook:', {
                coin: orderbook.coin,
                hasBids: !!orderbook.bids?.length,
                hasAsks: !!orderbook.asks?.length
            });
            expect(orderbook).toBeDefined();
            expect(orderbook.coin).toBe('HYPE');
            expect(Array.isArray(orderbook.bids)).toBe(true);
            expect(Array.isArray(orderbook.asks)).toBe(true);

            // Unsubscribe
            elizaLogger.debug('Attempting to unsubscribe from HYPE orderbook');
            const unsubscribeResult = await unsubscribeAction!.handler(runtime, agentMessage, state, { coin: 'HYPE' }, callback);
            elizaLogger.debug('Unsubscribe result:', { success: unsubscribeResult });
            expect(unsubscribeResult).toBe(true);

            // Close connection
            elizaLogger.debug('Attempting to close WebSocket connection');
            const closeAction = wsActions.find(a => a.name === 'closeWebSocket');
            expect(closeAction).toBeDefined();
            const closeResult = await closeAction!.handler(runtime, agentMessage, state, {}, callback);
            elizaLogger.debug('Close result:', { success: closeResult });
            expect(closeResult).toBe(true);
            elizaLogger.debug('=== Subscribe/Unsubscribe Test Complete ===');
        }, 60000);

        it('should handle connection close and reconnect', async () => {
            elizaLogger.debug('=== Starting Close/Reconnect Test ===');
            const subscribeAction = wsActions.find(a => a.name === 'subscribeOrderbook');
            const reconnectAction = wsActions.find(a => a.name === 'reconnectWebSocket');
            const closeAction = wsActions.find(a => a.name === 'closeWebSocket');
            elizaLogger.debug('Actions found:', {
                hasSubscribe: !!subscribeAction,
                hasReconnect: !!reconnectAction,
                hasClose: !!closeAction
            });

            expect(subscribeAction).toBeDefined();
            expect(reconnectAction).toBeDefined();
            expect(closeAction).toBeDefined();

            // Create a promise that will resolve when we receive the first orderbook
            const messagePromise = new Promise<L2Book>((resolve) => {
                callback = (response: any) => {
                    elizaLogger.debug('Callback received response:', {
                        type: response.content?.type,
                        coin: response.content?.coin,
                        hasContent: !!response.content
                    });
                    if (response.content?.type === 'l2Book') {
                        elizaLogger.debug('Resolving l2Book message');
                        resolve(response.content as L2Book);
                    }
                    return Promise.resolve([]);
                };
            });

            // Subscribe to HYPE orderbook
            elizaLogger.debug('Attempting initial subscription to HYPE orderbook');
            const subscribeResult = await subscribeAction!.handler(runtime, agentMessage, state, { coin: 'HYPE' }, callback);
            elizaLogger.debug('Initial subscribe result:', { success: subscribeResult });
            expect(subscribeResult).toBe(true);

            // Wait for first message
            elizaLogger.debug('Waiting for initial orderbook message');
            const firstMessage = await Promise.race([
                messagePromise,
                new Promise<never>((_, reject) => {
                    elizaLogger.debug('Starting timeout for initial message');
                    setTimeout(() => {
                        elizaLogger.error('Timeout waiting for initial orderbook message');
                        reject(new Error('Timeout waiting for orderbook message'));
                    }, 30000);
                })
            ]);

            elizaLogger.debug('Received first message:', {
                coin: firstMessage.coin,
                hasBids: !!firstMessage.bids?.length,
                hasAsks: !!firstMessage.asks?.length
            });
            expect(firstMessage).toBeDefined();
            expect(firstMessage.coin).toBe('HYPE');

            // Create a new promise for the reconnect message
            const reconnectPromise = new Promise<L2Book>((resolve) => {
                callback = (response: any) => {
                    elizaLogger.debug('Reconnect callback received response:', {
                        type: response.content?.type,
                        coin: response.content?.coin,
                        hasContent: !!response.content
                    });
                    if (response.content?.type === 'l2Book') {
                        elizaLogger.debug('Resolving reconnect l2Book message');
                        resolve(response.content as L2Book);
                    }
                    return Promise.resolve([]);
                };
            });

            // Close and reconnect
            elizaLogger.debug('Attempting to close connection');
            const closeResult = await closeAction!.handler(runtime, agentMessage, state, {}, callback);
            elizaLogger.debug('Close result:', { success: closeResult });
            expect(closeResult).toBe(true);

            elizaLogger.debug('Attempting to reconnect');
            const reconnectResult = await reconnectAction!.handler(runtime, agentMessage, state, {}, callback);
            elizaLogger.debug('Reconnect result:', { success: reconnectResult });
            expect(reconnectResult).toBe(true);

            // Subscribe again
            elizaLogger.debug('Attempting to resubscribe after reconnect');
            const resubscribeResult = await subscribeAction!.handler(runtime, agentMessage, state, { coin: 'HYPE' }, callback);
            elizaLogger.debug('Resubscribe result:', { success: resubscribeResult });
            expect(resubscribeResult).toBe(true);

            // Wait for reconnect message
            elizaLogger.debug('Waiting for post-reconnect message');
            const reconnectMessage = await Promise.race([
                reconnectPromise,
                new Promise<never>((_, reject) => {
                    elizaLogger.debug('Starting timeout for reconnect message');
                    setTimeout(() => {
                        elizaLogger.error('Timeout waiting for reconnect message');
                        reject(new Error('Timeout waiting for reconnect message'));
                    }, 30000);
                })
            ]);

            elizaLogger.debug('Received reconnect message:', {
                coin: reconnectMessage.coin,
                hasBids: !!reconnectMessage.bids?.length,
                hasAsks: !!reconnectMessage.asks?.length
            });
            expect(reconnectMessage).toBeDefined();
            expect(reconnectMessage.coin).toBe('HYPE');

            // Clean up
            elizaLogger.debug('Performing final cleanup');
            const finalCloseResult = await closeAction!.handler(runtime, agentMessage, state, {}, callback);
            elizaLogger.debug('Final close result:', { success: finalCloseResult });
            expect(finalCloseResult).toBe(true);
            elizaLogger.debug('=== Close/Reconnect Test Complete ===');
        }, 60000);
    });
});