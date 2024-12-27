import WebSocket from 'ws';
import { elizaLogger } from '@elizaos/core';
import type { WebSocketMessage } from '../types/api';
import type { HyperliquidConfig } from '../types';
import { WSS_URLS } from '../types/constants';

export class WebSocketTransport {
    private ws: WebSocket | null = null;
    private readonly baseWsUrl: string;
    private messageHandlers: Array<(message: WebSocketMessage) => void> = [];
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private messageId: number = 1;

    constructor(config: HyperliquidConfig) {
        this.baseWsUrl = process.env.HYPERLIQUID_WS_URL || 'wss://api.hyperliquid.xyz/ws';
        elizaLogger.debug('WebSocket URL:', this.baseWsUrl);
    }

    async connect(): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            elizaLogger.debug('Establishing WebSocket connection...');
            this.ws = new WebSocket(this.baseWsUrl);

            await new Promise((resolve, reject) => {
                if (!this.ws) return reject(new Error('WebSocket not initialized'));

                this.ws.on('open', () => {
                    elizaLogger.debug('WebSocket connection established');
                    this.startHeartbeat();
                    resolve(undefined);
                });

                this.ws.on('error', (error) => {
                    elizaLogger.error('WebSocket connection error:', error);
                    reject(error);
                });

                this.ws.on('close', () => {
                    elizaLogger.debug('WebSocket connection closed');
                    this.stopHeartbeat();
                });

                this.ws.on('message', (data) => {
                    try {
                        const rawMessage = data.toString();
                        elizaLogger.debug('Received WebSocket message:', rawMessage);

                        const message = JSON.parse(rawMessage);
                        if (message.channel === 'error') {
                            elizaLogger.error('WebSocket error message:', message);
                        } else {
                            // Transform the message to match expected WebSocketMessage type
                            let transformedMessage: WebSocketMessage;

                            if (message.channel === 'l2Book') {
                                // Transform l2Book message
                                const [bids, asks] = message.data.levels;
                                transformedMessage = {
                                    type: 'l2Book',
                                    data: {
                                        coin: message.data.coin,
                                        time: message.data.time,
                                        bids: bids,
                                        asks: asks
                                    },
                                    channel: message.channel
                                };
                            } else {
                                // Transform other messages
                                transformedMessage = {
                                    type: message.channel || message.type,
                                    data: message.data,
                                    channel: message.channel || message.type
                                };
                            }

                            elizaLogger.debug('Transformed message:', transformedMessage);
                            this.messageHandlers.forEach(handler => handler(transformedMessage));
                        }
                    } catch (error) {
                        elizaLogger.error('Failed to parse WebSocket message:', error);
                    }
                });
            });
        }
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                const pingMessage = { method: 'ping' };
                elizaLogger.debug('Sending heartbeat:', pingMessage);
                this.ws.send(JSON.stringify(pingMessage));
            }
        }, 30000); // Send heartbeat every 30 seconds
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            elizaLogger.debug('Stopping heartbeat');
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    async close(): Promise<void> {
        this.stopHeartbeat();
        if (this.ws) {
            elizaLogger.debug('Closing WebSocket connection');
            this.ws.close();
            this.ws = null;
        }
    }

    onMessage(handler: (message: WebSocketMessage) => void): void {
        this.messageHandlers.push(handler);
        elizaLogger.debug('Added message handler, total handlers:', this.messageHandlers.length);
    }

    private async ensureConnection(): Promise<WebSocket> {
        await this.connect();
        if (!this.ws) throw new Error('WebSocket not initialized');
        return this.ws;
    }

    async subscribe(channel: string, params?: Record<string, unknown>): Promise<void> {
        try {
            const ws = await this.ensureConnection();
            const message = {
                method: 'subscribe',
                subscription: {
                    type: channel,
                    ...params
                }
            };
            elizaLogger.debug('Sending subscription message:', message);
            ws.send(JSON.stringify(message));
            elizaLogger.debug(`Subscribed to channel: ${channel}`, message);
        } catch (error) {
            elizaLogger.error(`Failed to subscribe to channel ${channel}:`, error);
            throw error;
        }
    }

    async unsubscribe(channel: string, params?: Record<string, unknown>): Promise<void> {
        try {
            const ws = await this.ensureConnection();
            const message = {
                method: 'unsubscribe',
                subscription: {
                    type: channel,
                    ...params
                }
            };
            elizaLogger.debug('Sending unsubscribe message:', message);
            ws.send(JSON.stringify(message));
            elizaLogger.debug(`Unsubscribed from channel: ${channel}`, message);
        } catch (error) {
            elizaLogger.error(`Failed to unsubscribe from channel ${channel}:`, error);
            throw error;
        }
    }
}
