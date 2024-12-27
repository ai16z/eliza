import { Action, IAgentRuntime, Memory, State, HandlerCallback, elizaLogger } from '@elizaos/core';
import { WebSocketTransport } from '../transport/ws.transport';
import type { L2Book, WebSocketMessage } from '../types/api';

// Helper type for WebSocket state that integrates with Eliza
interface WsState extends State {
    wsTransport?: WebSocketTransport;
    messageHandler?: (message: WebSocketMessage) => void;
    subscriptions?: Set<string>;  // Track active subscriptions
}

// Helper to ensure state is properly initialized
function ensureWsState(state: State): WsState {
    const wsState = state as WsState;
    if (!wsState.subscriptions) {
        wsState.subscriptions = new Set();
    }
    return wsState;
}

// Helper to transform WebSocket messages to Eliza format
function transformToElizaMessage(message: WebSocketMessage) {
    return {
        text: `Received ${message.type} update for ${message.data?.coin}`,
        content: {
            type: message.type,
            ...message.data
        }
    };
}

async function getWsTransport(runtime: IAgentRuntime, state: WsState): Promise<WebSocketTransport> {
    elizaLogger.debug('Getting WebSocket transport:', {
        hasExistingTransport: !!state.wsTransport,
        hasMessageHandler: !!state.messageHandler,
        activeSubscriptions: state.subscriptions?.size || 0
    });

    // Return existing transport if available
    if (state.wsTransport instanceof WebSocketTransport) {
        elizaLogger.debug('Using existing WebSocket transport');
        return state.wsTransport;
    }

    elizaLogger.debug('Creating new WebSocket transport');
    const walletAddress = runtime.getSetting('HYPERLIQUID_WALLET_ADDRESS');
    const baseUrl = runtime.getSetting('HYPERLIQUID_BASE_URL') || 'https://api.hyperliquid.xyz';
    const network = runtime.getSetting('HYPERLIQUID_NETWORK') || 'mainnet';

    elizaLogger.debug('Transport configuration:', { baseUrl, network, hasWalletAddress: !!walletAddress });

    if (!walletAddress) {
        throw new Error('HYPERLIQUID_WALLET_ADDRESS must be set');
    }

    // Create new transport and store in state
    const transport = new WebSocketTransport({
        baseUrl,
        walletAddress,
        network: network as 'mainnet' | 'testnet'
    });

    state.wsTransport = transport;
    elizaLogger.debug('Created and stored new WebSocket transport');
    return transport;
}

export const wsActions: Action[] = [
    {
        name: 'subscribeOrderbook',
        description: 'Subscribe to real-time orderbook updates for a specific coin',
        similes: ['Watch orderbook', 'Monitor orders', 'Order stream'],
        examples: [[{ user: 'user', content: { text: 'Watch HYPE orderbook' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                elizaLogger.debug('Starting subscribeOrderbook handler:', {
                    options,
                    hasState: !!state,
                    hasCallback: !!callback
                });

                const coin = options?.coin as string;
                if (!coin) {
                    throw new Error('Coin is required');
                }

                if (!state) {
                    throw new Error('State is required');
                }

                const wsState = ensureWsState(state);
                elizaLogger.debug('Current WebSocket state:', {
                    hasTransport: !!wsState.wsTransport,
                    hasMessageHandler: !!wsState.messageHandler,
                    activeSubscriptions: wsState.subscriptions?.size || 0
                });

                const transport = await getWsTransport(runtime, wsState);

                // Always connect - the connect method handles already connected state
                elizaLogger.debug('Connecting to WebSocket');
                await transport.connect();
                elizaLogger.debug('Connected to WebSocket');

                // Setup message handler if not already set
                if (!wsState.messageHandler && callback) {
                    elizaLogger.debug('Setting up message handler');
                    const handler = (message: WebSocketMessage) => {
                        elizaLogger.debug('Received WebSocket message:', {
                            type: message.type,
                            coin: message.data?.coin,
                            hasData: !!message.data
                        });
                        callback(transformToElizaMessage(message));
                    };
                    wsState.messageHandler = handler;
                    transport.onMessage(handler);
                    elizaLogger.debug('Message handler set up');
                }

                elizaLogger.debug('Subscribing to orderbook:', { coin });
                await transport.subscribe('l2Book', { coin });
                wsState.subscriptions.add(coin);
                elizaLogger.debug('Subscribed to orderbook:', {
                    coin,
                    activeSubscriptions: wsState.subscriptions.size
                });

                if (callback) {
                    callback({
                        text: `Successfully subscribed to ${coin} orderbook`,
                        content: { status: 'subscribed', coin }
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to subscribe to orderbook:', {
                    error: (error as Error).message,
                    stack: (error as Error).stack
                });
                if (callback) {
                    callback({
                        text: `Failed to subscribe to orderbook: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'unsubscribeOrderbook',
        description: 'Unsubscribe from orderbook updates for a specific coin',
        similes: ['Stop watching orderbook', 'Stop monitoring orders', 'Stop order stream'],
        examples: [[{ user: 'user', content: { text: 'Stop watching HYPE orderbook' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                elizaLogger.debug('Starting unsubscribeOrderbook handler:', {
                    options,
                    hasState: !!state
                });

                const coin = options?.coin as string;
                if (!coin) {
                    throw new Error('Coin is required');
                }

                if (!state) {
                    throw new Error('State is required');
                }

                const wsState = ensureWsState(state);
                elizaLogger.debug('Current WebSocket state:', {
                    hasTransport: !!wsState.wsTransport,
                    activeSubscriptions: wsState.subscriptions.size || 0
                });

                const transport = await getWsTransport(runtime, wsState);

                elizaLogger.debug('Unsubscribing from orderbook:', { coin });
                await transport.unsubscribe('l2Book', { coin });
                wsState.subscriptions.delete(coin);
                elizaLogger.debug('Unsubscribed from orderbook:', {
                    coin,
                    remainingSubscriptions: wsState.subscriptions.size
                });

                if (callback) {
                    callback({
                        text: `Successfully unsubscribed from ${coin} orderbook`,
                        content: { status: 'unsubscribed', coin }
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to unsubscribe from orderbook:', {
                    error: (error as Error).message,
                    stack: (error as Error).stack
                });
                if (callback) {
                    callback({
                        text: `Failed to unsubscribe from orderbook: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'reconnectWebSocket',
        description: 'Reconnect the WebSocket connection',
        similes: ['Reconnect websocket', 'Restart connection', 'Reset websocket'],
        examples: [[{ user: 'user', content: { text: 'Reconnect websocket' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                elizaLogger.debug('Starting reconnectWebSocket handler:', {
                    hasState: !!state,
                    options
                });

                if (!state) {
                    throw new Error('State is required');
                }

                const wsState = ensureWsState(state);
                elizaLogger.debug('Current WebSocket state:', {
                    hasTransport: !!wsState.wsTransport,
                    hasMessageHandler: !!wsState.messageHandler,
                    activeSubscriptions: wsState.subscriptions.size || 0
                });

                const transport = await getWsTransport(runtime, wsState);

                elizaLogger.debug('Closing WebSocket connection');
                await transport.close();
                elizaLogger.debug('Closed WebSocket connection');

                elizaLogger.debug('Reconnecting WebSocket');
                await transport.connect();
                elizaLogger.debug('Reconnected WebSocket');

                // Reattach message handler if it exists
                if (wsState.messageHandler) {
                    elizaLogger.debug('Reattaching message handler');
                    transport.onMessage(wsState.messageHandler);
                    elizaLogger.debug('Message handler reattached');
                }

                // Resubscribe to active subscriptions
                if (wsState.subscriptions.size > 0) {
                    elizaLogger.debug('Resubscribing to active subscriptions:', {
                        count: wsState.subscriptions.size,
                        subscriptions: Array.from(wsState.subscriptions)
                    });
                    for (const coin of wsState.subscriptions) {
                        await transport.subscribe('l2Book', { coin });
                        elizaLogger.debug('Resubscribed to:', { coin });
                    }
                }

                if (callback) {
                    callback({
                        text: 'Successfully reconnected WebSocket',
                        content: { status: 'reconnected' }
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to reconnect WebSocket:', {
                    error: (error as Error).message,
                    stack: (error as Error).stack
                });
                if (callback) {
                    callback({
                        text: `Failed to reconnect WebSocket: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'closeWebSocket',
        description: 'Close the WebSocket connection',
        similes: ['Close websocket', 'Disconnect', 'Stop connection'],
        examples: [[{ user: 'user', content: { text: 'Close websocket connection' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                elizaLogger.debug('Starting closeWebSocket handler:', {
                    hasState: !!state,
                    options
                });

                if (!state) {
                    throw new Error('State is required');
                }

                const wsState = ensureWsState(state);
                elizaLogger.debug('Current WebSocket state:', {
                    hasTransport: !!wsState.wsTransport,
                    hasMessageHandler: !!wsState.messageHandler,
                    activeSubscriptions: wsState.subscriptions.size || 0
                });

                const transport = await getWsTransport(runtime, wsState);

                elizaLogger.debug('Closing WebSocket connection');
                await transport.close();
                elizaLogger.debug('Closed WebSocket connection');

                // Clear state
                elizaLogger.debug('Clearing WebSocket state');
                delete wsState.wsTransport;
                delete wsState.messageHandler;
                wsState.subscriptions.clear();
                elizaLogger.debug('WebSocket state cleared');

                if (callback) {
                    callback({
                        text: 'Successfully closed WebSocket connection',
                        content: { status: 'closed' }
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to close WebSocket:', {
                    error: (error as Error).message,
                    stack: (error as Error).stack
                });
                if (callback) {
                    callback({
                        text: `Failed to close WebSocket: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    }
];