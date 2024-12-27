import { describe, it, expect, beforeEach } from 'vitest';
import { WebSocketTransport } from '../../src/transport/ws.transport';
import type { L2Book, WebSocketMessage } from '../../src/types/api';

describe('WebSocketTransport Integration', () => {
    let transport: WebSocketTransport;

    beforeEach(() => {
        // Skip tests if wallet address is not set
        if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
            console.warn('Skipping tests: HYPERLIQUID_WALLET_ADDRESS not set');
            return;
        }

        transport = new WebSocketTransport({
            baseUrl: process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz',
            walletAddress: process.env.HYPERLIQUID_WALLET_ADDRESS,
            network: 'mainnet'
        });
    });

    describe('subscription management', () => {
        it('should subscribe and unsubscribe from orderbook', async () => {
            // Connect to WebSocket
            await transport.connect();

            // Subscribe to HYPE orderbook
            const messagePromise = new Promise<L2Book>((resolve) => {
                transport.onMessage((message: WebSocketMessage) => {
                    if (message.type === 'l2Book' && message.data?.coin === 'HYPE') {
                        resolve(message.data as L2Book);
                    }
                });
            });

            // Subscribe with correct format
            await transport.subscribe('l2Book', { coin: 'HYPE' });

            // Wait for first message with 30s timeout
            const message = await Promise.race([
                messagePromise,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout waiting for orderbook message')), 30000)
                )
            ]);

            expect(message).toBeDefined();
            expect(message.coin).toBe('HYPE');
            expect(Array.isArray(message.bids)).toBe(true);
            expect(Array.isArray(message.asks)).toBe(true);

            // Unsubscribe
            await transport.unsubscribe('l2Book', { coin: 'HYPE' });

            // Close connection
            await transport.close();
        });

        it('should handle connection close and reconnect', async () => {
            // Connect to WebSocket
            await transport.connect();

            // Subscribe to HYPE orderbook
            const messagePromise = new Promise<L2Book>((resolve) => {
                transport.onMessage((message: WebSocketMessage) => {
                    if (message.type === 'l2Book' && message.data?.coin === 'HYPE') {
                        resolve(message.data as L2Book);
                    }
                });
            });

            await transport.subscribe('l2Book', { coin: 'HYPE' });

            // Wait for first message with timeout
            const message = await Promise.race([
                messagePromise,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout waiting for orderbook message')), 30000)
                )
            ]);

            expect(message).toBeDefined();
            expect(message.coin).toBe('HYPE');

            // Simulate connection close and reconnect
            await transport.close();
            await transport.connect();

            // Should automatically resubscribe
            const reconnectPromise = new Promise<L2Book>((resolve) => {
                transport.onMessage((message: WebSocketMessage) => {
                    if (message.type === 'l2Book' && message.data?.coin === 'HYPE') {
                        resolve(message.data as L2Book);
                    }
                });
            });

            await transport.subscribe('l2Book', { coin: 'HYPE' });

            // Wait for reconnect message with timeout
            const reconnectMessage = await Promise.race([
                reconnectPromise,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout waiting for reconnect message')), 30000)
                )
            ]);

            expect(reconnectMessage).toBeDefined();
            expect(reconnectMessage.coin).toBe('HYPE');

            // Clean up
            await transport.unsubscribe('l2Book', { coin: 'HYPE' });
            await transport.close();
        });
    });
});