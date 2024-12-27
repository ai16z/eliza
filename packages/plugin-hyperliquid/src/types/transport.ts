export interface HttpTransportConfig {
    infoUrl: string;
    exchangeUrl: string;
    timeout?: number;
}

export interface WebSocketTransportConfig {
    wsUrl: string;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
}
