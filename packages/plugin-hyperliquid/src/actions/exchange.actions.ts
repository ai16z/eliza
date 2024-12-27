import { Action, IAgentRuntime, Memory, State, HandlerCallback, elizaLogger } from '@elizaos/core';
import { HyperliquidService } from '../hyperliquid.service';
import { MarginError, PositionError, OrderError } from '../errors';
import type {
    OrderRequest,
    OrderResponse,
    CancelOrderRequest,
    CancelOrderResponse
} from '../types/api';

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

export const exchangeActions: Action[] = [
    {
        name: 'placeOrder',
        description: 'Place a new order (limit or market)',
        similes: ['Place order', 'Create order', 'Submit order'],
        examples: [
            [{ user: 'user', content: { text: 'Place a buy limit order for BTC at 50000' } }],
            [{ user: 'user', content: { text: 'Place a market sell order for ETH' } }]
        ],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const order = options?.request as OrderRequest;
                if (!order) {
                    const error = new OrderError('Order details are required');
                    if (callback) {
                        callback({
                            text: `Failed to place order: ${error.message}`,
                            content: { error: error.message }
                        });
                    }
                    return false;
                }

                const service = await getService(runtime);
                const result = await service.placeOrder(order);

                // Check for errors in the response
                const error = result?.response?.data?.statuses[0]?.error;
                if (error) {
                    // Handle specific error types
                    if (error.includes('margin')) {
                        throw new MarginError(`Insufficient margin: ${error}`);
                    }
                    if (error.includes('position cap') || error.includes('open interest is at cap')) {
                        throw new PositionError(`Position cap exceeded: ${error}`);
                    }
                    if (error.includes('reduce only') || error.includes('would increase position')) {
                        throw new OrderError(`Reduce-only violation: ${error}`);
                    }
                    // Default to OrderError for unknown cases
                    throw new OrderError(`Order placement failed: ${error}`);
                }

                if (callback) {
                    callback({
                        text: `Successfully placed order`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                // Log the error with our custom error types
                elizaLogger.error('Failed to place order:', error);
                if (callback) {
                    callback({
                        text: `Failed to place order: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                // If it's one of our custom errors, return false to indicate failure
                if (error instanceof MarginError || error instanceof PositionError || error instanceof OrderError) {
                    return false;
                }
                // For other errors, rethrow
                throw error;
            }
        }
    },
    {
        name: 'cancelOrder',
        description: 'Cancel an existing order',
        similes: ['Cancel order', 'Remove order', 'Delete order'],
        examples: [[{ user: 'user', content: { text: 'Cancel order 123' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const request = options?.request as CancelOrderRequest;
                if (!request) {
                    const error = new OrderError('Cancel order request is required');
                    if (callback) {
                        callback({
                            text: `Failed to cancel order: ${error.message}`,
                            content: { error: error.message }
                        });
                    }
                    return false;
                }

                const service = await getService(runtime);
                const result = await service.cancelOrders(request);

                // Check for errors in the response
                const error = result?.response?.data?.statuses[0]?.error;
                if (error) {
                    // Handle specific error types
                    if (error.includes('never placed') || error.includes('already canceled') || error.includes('filled')) {
                        throw new OrderError(`Order not found: ${error}`);
                    }
                    if (error.includes('permission')) {
                        throw new OrderError(`Permission denied: ${error}`);
                    }
                    // Default to OrderError for unknown cases
                    throw new OrderError(`Cancel order failed: ${error}`);
                }

                if (callback) {
                    callback({
                        text: `Successfully cancelled order ${request.oid}`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                // Log the error with our custom error types
                elizaLogger.error('Failed to cancel order:', error);
                if (callback) {
                    callback({
                        text: `Failed to cancel order: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'modifyOrder',
        description: 'Modify an existing order',
        similes: ['Modify order', 'Update order', 'Change order'],
        examples: [[{ user: 'user', content: { text: 'Modify order 123 price to 45000' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const request = options?.request as OrderRequest & { oid: number };
                if (!request) {
                    const error = new OrderError('Modify order request is required');
                    if (callback) {
                        callback({
                            text: `Failed to modify order: ${error.message}`,
                            content: { error: error.message }
                        });
                    }
                    return false;
                }

                const service = await getService(runtime);

                // First check if the order exists
                try {
                    await service.getOrderStatus({ oid: request.oid, coin: request.coin });
                } catch (error) {
                    const orderError = new OrderError('Order not found: Order was never placed, already canceled, or filled');
                    if (callback) {
                        callback({
                            text: `Failed to modify order: ${orderError.message}`,
                            content: { error: orderError.message }
                        });
                    }
                    return false;
                }

                const result = await service.placeOrder(request);

                // Check for errors in the response
                const error = result?.response?.data?.statuses[0]?.error;
                if (error) {
                    // Handle specific error types
                    if (error.includes('not found') || error.includes('invalid order') || error.includes('never placed') || error.includes('already canceled') || error.includes('filled')) {
                        throw new OrderError(`Order not found: ${error}`);
                    }
                    if (error.includes('permission')) {
                        throw new OrderError(`Permission denied: ${error}`);
                    }
                    // Also handle margin and position errors for modify
                    if (error.includes('margin')) {
                        throw new MarginError(`Insufficient margin: ${error}`);
                    }
                    if (error.includes('position cap') || error.includes('open interest is at cap')) {
                        throw new PositionError(`Position cap exceeded: ${error}`);
                    }
                    if (error.includes('reduce only') || error.includes('would increase position')) {
                        throw new OrderError(`Reduce-only violation: ${error}`);
                    }
                    // Default to OrderError for unknown cases
                    throw new OrderError(`Modify order failed: ${error}`);
                }

                if (callback) {
                    callback({
                        text: `Successfully modified order ${request.oid}`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                // Log the error with our custom error types
                elizaLogger.error('Failed to modify order:', error);
                if (callback) {
                    callback({
                        text: `Failed to modify order: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                // If it's one of our custom errors, return false to indicate failure
                if (error instanceof MarginError || error instanceof PositionError || error instanceof OrderError) {
                    return false;
                }
                // For other errors, rethrow
                throw error;
            }
        }
    },
    {
        name: 'getOrderStatus',
        description: 'Get the status of an order',
        similes: ['Check order status', 'Get order status', 'Order status'],
        examples: [[{ user: 'user', content: { text: 'Get status of order 123' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const request = options?.request as { oid: number; coin: string };
                if (!request) {
                    throw new Error('Order status request is required');
                }

                const service = await getService(runtime);
                const result = await service.getOrderStatus(request);

                if (callback) {
                    callback({
                        text: `Order ${request.oid} status: ${result.status}`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to get order status:', error);
                if (callback) {
                    callback({
                        text: `Failed to get order status: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    }
];