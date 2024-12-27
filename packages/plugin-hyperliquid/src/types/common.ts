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

/** Ethereum address or transaction hash. */
export type Hex = `0x${string}`;

/** Base structure for exchange requests. */
export interface BaseExchangeRequest {
    /** Action to perform. */
    action: {
        /** Type of action. */
        type: string;

        /** Additional action parameters. */
        [key: string]: unknown;
    };

    /** Unique request identifier (recommended: current timestamp in ms). */
    nonce: number;

    /** Cryptographic signature. */
    signature: { r: Hex; s: Hex; v: number };
}

/** Base structure for exchange responses. */
export interface BaseExchangeResponse {
    /** Response status */
    status: "ok" | "err";

    /** Error message or success data */
    response: string | {
        /** Type of operation. */
        type: string;

        /** Specific data for the operation. */
        data?: unknown;
    };
}

/** Successful response without specific data. */
export interface SuccessResponse extends BaseExchangeResponse {
    /** Successful status. */
    status: "ok";

    /** Response details. */
    response: {
        /** Type of operation. */
        type: "default";
    };
}

/** Error response for failed operations. */
export interface ErrorResponse extends BaseExchangeResponse {
    /** Error status. */
    status: "err";

    /** Error message. */
    response: string;
}

/** Configuration for HTTP transport. */
export interface HttpConfig {
    /** Base URL for REST API. */
    baseUrl: string;

    /** API key. */
    apiKey?: string;

    /** API secret. */
    apiSecret?: string;

    /** Request timeout in milliseconds. */
    timeout?: number;
}

/** Configuration for WebSocket transport. */
export interface WebSocketConfig {
    /** WebSocket URL. */
    wsUrl: string;

    /** API key. */
    apiKey?: string;

    /** API secret. */
    apiSecret?: string;

    /** Reconnection delay in milliseconds. */
    reconnectDelay?: number;

    /** Maximum number of reconnection attempts. */
    maxReconnectAttempts?: number;
}

/** Configuration for Hyperliquid plugin. */
export interface HyperliquidConfig extends HttpConfig, WebSocketConfig {
    /** Network name. */
    network?: 'mainnet' | 'testnet';
}
