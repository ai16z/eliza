/**
          _____                    _____                    _____                    _____           _______                   _____
         /\    \                  /\    \                  /\    \                  /\    \         /::\    \                 /\    \
        /::\    \                /::\    \                /::\    \                /::\____\       /::::\    \               /:::\____\
       /::::\    \               \:::\    \              /::::\    \              /:::/    /      /::::::\    \             /:::/    /
      /::::::\    \               \:::\    \            /::::::\    \            /:::/    /      /::::::::\    \           /:::/   _/___
     /:::/\:::\    \               \:::\    \          /:::/\:::\    \          /:::/    /      /:::/~~\:::\    \         /:::/   /\    \
    /:::/__\:::\    \               \:::\    \        /:::/__\:::\    \        /:::/    /      /:::/    \:::\    \       /:::/   /::\____\
   /::::\   \:::\    \              /::::\    \      /::::\   \:::\    \      /:::/    /      /:::/    / \:::\    \     /:::/   /:::/    /
  /::::::\   \:::\    \    ____    /::::::\    \    /::::::\   \:::\    \    /:::/    /      /:::/____/   \:::\____\   /:::/   /:::/   _/___
 /:::/\:::\   \:::\    \  /\   \  /:::/\:::\    \  /:::/\:::\   \:::\    \  /:::/    /      |:::|    |     |:::|    | /:::/___/:::/   /\    \
/:::/  \:::\   \:::\____\/::\   \/:::/  \:::\____\/:::/  \:::\   \:::\____\/:::/____/       |:::|____|     |:::|    ||:::|   /:::/   /::\____\
\::/    \:::\  /:::/    /\:::\  /:::/    \::/    /\::/    \:::\   \::/    /\:::\    \        \:::\    \   /:::/    / |:::|__/:::/   /:::/    /
 \/____/ \:::\/:::/    /  \:::\/:::/    / \/____/  \/____/ \:::\   \/____/  \:::\    \        \:::\    \ /:::/    /   \:::\/:::/   /:::/    /
          \::::::/    /    \::::::/    /                    \:::\    \       \:::\    \        \:::\    /:::/    /     \::::::/   /:::/    /
           \::::/    /      \::::/____/                      \:::\____\       \:::\    \        \:::\__/:::/    /       \::::/___/:::/    /
           /:::/    /        \:::\    \                       \::/    /        \:::\    \        \::::::::/    /         \:::\__/:::/    /
          /:::/    /          \:::\    \                       \/____/          \:::\    \        \::::::/    /           \::::::::/    /
         /:::/    /            \:::\    \                                        \:::\    \        \::::/    /             \::::::/    /
        /:::/    /              \:::\    \                                        \:::\____\        \::/____/               \::::/    /
        \::/    /                \:::\____\                                        \::/    /         ~~                      \::/____/
         \/____/                  \::/    /                                         \/____/                                   ~~
                                  \/____/
*/

/**
 * Configuration interface for the Hyperliquid plugin
 */
export interface HyperliquidConfig {
    /**
     * Base URL for the API
     */
    baseUrl?: string;

    /**
     * Base URL for WebSocket connections
     */
    wsUrl?: string;

    /**
     * Network to use (mainnet or testnet)
     */
    network?: 'mainnet' | 'testnet';

    /**
     * Wallet address for authentication
     */
    walletAddress?: string;

    /**
     * Private key for signing transactions
     */
    privateKey?: string;

    /**
     * API key for authentication
     */
    apiKey?: string;

    /**
     * API secret for authentication
     */
    apiSecret?: string;

    /**
     * Request timeout in milliseconds
     */
    timeout?: number;
}

/**
 * Internal service configuration
 */
export interface ServiceConfig {
    /** Whether to use testnet */
    testnet: boolean;

    /** Private key for signing transactions */
    privateKey: string;

    /** Wallet address */
    walletAddress: string;

    /** Default order parameters */
    defaultOrderParams: {
        timeInForce: 'gtc' | 'ioc' | 'fok';
        leverage: number;
        marginType: 'cross' | 'isolated';
    };

    /** Rate limiting configuration */
    rateLimit: {
        maxRequests: number;
        windowMs: number;
        enabled: boolean;
    };
}

/**
 * Transport configuration interface
 */
export interface TransportConfig {
    /** Base URL for the transport */
    url: string;

    /** Request timeout in milliseconds */
    timeout?: number;

    /** Custom headers */
    headers?: Record<string, string>;

    /** Whether to enable compression */
    compression?: boolean;

    /** Whether to enable keep-alive */
    keepAlive?: boolean;

    /** Maximum number of retries */
    maxRetries?: number;

    /** Retry delay in milliseconds */
    retryDelay?: number;

    /** Whether to enable request validation */
    validateRequests?: boolean;
}

/**
 * Common interface for transport layers
 */
export interface ITransport {
    /** Make a request to the API */
    request<T>(endpoint: string, method?: string, data?: unknown): Promise<T>;

    /** Close the transport connection */
    close?(): Promise<void>;

    /** Get transport status */
    status?(): 'connected' | 'disconnected' | 'connecting';
}

/**
 * WebSocket subscription types
 */
export type SubscriptionType =
    | 'trades'
    | 'orderbook'
    | 'ticker'
    | 'positions'
    | 'orders'
    | 'balances'
    | 'liquidations';

/**
 * WebSocket message handler type
 */
export type MessageHandler<T = unknown> = (data: T) => void;

/**
 * Supported wallet types for authentication
 */
export type WalletType =
    | string
    | object;
