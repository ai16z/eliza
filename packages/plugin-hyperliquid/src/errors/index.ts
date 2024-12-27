import { elizaLogger } from '@elizaos/core';

/**
 * Base error class for Hyperliquid plugin.
 */
export class HyperliquidError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'HyperliquidError';
        Object.setPrototypeOf(this, HyperliquidError.prototype);
        elizaLogger.error(`${this.name}: ${message}`);
    }
}

/** Error class for HTTP transport errors. */
export class HttpError extends HyperliquidError {
    constructor(message: string, public statusCode?: number) {
        super(`HTTP Error: ${message}${statusCode ? ` (${statusCode})` : ''}`);
        this.name = 'HttpError';
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}

/** Error class for WebSocket transport errors. */
export class WebSocketError extends HyperliquidError {
    constructor(message: string) {
        super(`WebSocket Error: ${message}`);
        this.name = 'WebSocketError';
        Object.setPrototypeOf(this, WebSocketError.prototype);
    }
}

/** Error class for authentication errors. */
export class AuthError extends HyperliquidError {
    constructor(message: string) {
        super(`Authentication Error: ${message}`);
        this.name = 'AuthError';
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}

/** Error class for validation errors. */
export class ValidationError extends HyperliquidError {
    constructor(message: string) {
        super(`Validation Error: ${message}`);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

/** Error class for rate limit errors. */
export class RateLimitError extends HyperliquidError {
    constructor(message: string, public retryAfter?: number) {
        super(`Rate Limit Error: ${message}${retryAfter ? ` (retry after ${retryAfter}s)` : ''}`);
        this.name = 'RateLimitError';
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

/** Error class for timeout errors. */
export class TimeoutError extends HyperliquidError {
    constructor(message: string) {
        super(`Timeout Error: ${message}`);
        this.name = 'TimeoutError';
        Object.setPrototypeOf(this, TimeoutError.prototype);
    }
}

/** Error class for connection errors. */
export class ConnectionError extends HyperliquidError {
    constructor(message: string) {
        super(`Connection Error: ${message}`);
        this.name = 'ConnectionError';
        Object.setPrototypeOf(this, ConnectionError.prototype);
    }
}

/** Error class for subscription errors. */
export class SubscriptionError extends HyperliquidError {
    constructor(message: string) {
        super(`Subscription Error: ${message}`);
        this.name = 'SubscriptionError';
        Object.setPrototypeOf(this, SubscriptionError.prototype);
    }
}

/** Error class for order errors. */
export class OrderError extends HyperliquidError {
    constructor(message: string) {
        super(`Order Error: ${message}`);
        this.name = 'OrderError';
        Object.setPrototypeOf(this, OrderError.prototype);
    }
}

/** Error class for position errors. */
export class PositionError extends HyperliquidError {
    constructor(message: string) {
        super(`Position Error: ${message}`);
        this.name = 'PositionError';
        Object.setPrototypeOf(this, PositionError.prototype);
    }
}

/** Error class for margin errors. */
export class MarginError extends HyperliquidError {
    constructor(message: string) {
        super(`Margin Error: ${message}`);
        this.name = 'MarginError';
        Object.setPrototypeOf(this, MarginError.prototype);
    }
}

/** Error class for withdrawal errors. */
export class WithdrawalError extends HyperliquidError {
    constructor(message: string) {
        super(`Withdrawal Error: ${message}`);
        this.name = 'WithdrawalError';
        Object.setPrototypeOf(this, WithdrawalError.prototype);
    }
}

/** Error class for transfer errors. */
export class TransferError extends HyperliquidError {
    constructor(message: string) {
        super(`Transfer Error: ${message}`);
        this.name = 'TransferError';
        Object.setPrototypeOf(this, TransferError.prototype);
    }
}
