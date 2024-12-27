import { Action, IAgentRuntime, Memory, State, HandlerCallback, elizaLogger } from '@elizaos/core';
import { HyperliquidService } from '../hyperliquid.service';
import type {
    ClearingHouseState,
    UserOpenOrders,
    UserFills,
    MetaAndAssetCtxs,
    Meta,
    AllMids,
    UserFunding,
    UserNonFundingLedgerUpdates,
    FundingHistory
} from '../types/api';

async function getService(runtime: IAgentRuntime): Promise<HyperliquidService> {
    const walletAddress = runtime.getSetting('HYPERLIQUID_WALLET_ADDRESS');
    const baseUrl = runtime.getSetting('HYPERLIQUID_BASE_URL') || 'https://api.hyperliquid.xyz';
    const network = runtime.getSetting('HYPERLIQUID_NETWORK') || 'mainnet';

    if (!walletAddress) {
        throw new Error('HYPERLIQUID_WALLET_ADDRESS must be set');
    }

    return new HyperliquidService({
        baseUrl,
        walletAddress,
        network: network as 'mainnet' | 'testnet'
    });
}

export const infoActions: Action[] = [
    {
        name: 'getClearingHouseState',
        description: 'Get account position and balance information',
        similes: ['Get position', 'Check balance', 'Account info'],
        examples: [[{ user: 'user', content: { text: 'Get my position' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const address = options?.address as string || runtime.getSetting('HYPERLIQUID_WALLET_ADDRESS');
                if (!address) {
                    throw new Error('Wallet address is required');
                }

                const service = await getService(runtime);
                const result: ClearingHouseState = await service.getClearingHouseState(address);

                if (callback) {
                    callback({
                        text: `Account value: ${result.marginSummary.accountValue}`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to get clearing house state:', error);
                if (callback) {
                    callback({
                        text: `Failed to get clearing house state: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'getOpenOrders',
        description: 'Get open orders for a user',
        similes: ['List orders', 'Show orders', 'Active orders'],
        examples: [[{ user: 'user', content: { text: 'Show my open orders' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const address = options?.address as string || runtime.getSetting('HYPERLIQUID_WALLET_ADDRESS');
                if (!address) {
                    throw new Error('Wallet address is required');
                }

                const service = await getService(runtime);
                const result: UserOpenOrders = await service.getUserOpenOrders(address);

                if (callback) {
                    callback({
                        text: result.orders?.length === 0 ? 'No open orders found' : `Found ${result.orders?.length} open orders`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to get open orders:', error);
                if (callback) {
                    callback({
                        text: `Failed to get open orders: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'getUserFills',
        description: 'Get user fills',
        similes: ['List fills', 'Show fills', 'Trade history'],
        examples: [[{ user: 'user', content: { text: 'Show my fills' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const address = options?.address as string || runtime.getSetting('HYPERLIQUID_WALLET_ADDRESS');
                if (!address) {
                    throw new Error('Wallet address is required');
                }

                const service = await getService(runtime);
                const result: UserFills = await service.getUserFills(address);

                if (callback) {
                    callback({
                        text: result.fills?.length === 0 ? 'No fills found' : `Found ${result.fills?.length} fills`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to get user fills:', error);
                if (callback) {
                    callback({
                        text: `Failed to get user fills: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'getUserFillsByTime',
        description: 'Get user fills within a time range',
        similes: ['List fills by time', 'Show fills by time', 'Trade history by time'],
        examples: [[{ user: 'user', content: { text: 'Show my fills from last hour' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const address = options?.address as string || runtime.getSetting('HYPERLIQUID_WALLET_ADDRESS');
                if (!address) {
                    throw new Error('Wallet address is required');
                }

                const startTime = options?.startTime as number || Date.now() - 3600000;
                const service = await getService(runtime);
                const result: UserFills = await service.getUserFillsByTime(address, startTime);

                if (callback) {
                    callback({
                        text: result.fills?.length === 0 ? 'No fills found' : `Found ${result.fills?.length} fills`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to get user fills by time:', error);
                if (callback) {
                    callback({
                        text: `Failed to get user fills by time: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'getMeta',
        description: 'Get meta information about all markets',
        similes: ['Get markets', 'Show markets', 'Market info'],
        examples: [[{ user: 'user', content: { text: 'Show available markets' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const service = await getService(runtime);
                const result: Meta = await service.getMeta();

                if (callback) {
                    callback({
                        text: `Found ${result.universe.length} markets`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to get meta:', error);
                if (callback) {
                    callback({
                        text: `Failed to get meta: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'getMetaAndAssetCtxs',
        description: 'Get meta information and asset contexts',
        similes: ['Get market contexts', 'Show market details', 'Market contexts'],
        examples: [[{ user: 'user', content: { text: 'Show market contexts' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const service = await getService(runtime);
                const result: MetaAndAssetCtxs = await service.getMetaAndAssetCtxs();

                if (callback) {
                    callback({
                        text: `Retrieved meta and asset contexts`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to get meta and asset contexts:', error);
                if (callback) {
                    callback({
                        text: `Failed to get meta and asset contexts: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'getAllMids',
        description: 'Get all mids for all coins',
        similes: ['Get mid prices', 'Show mids', 'Mid prices'],
        examples: [[{ user: 'user', content: { text: 'Show mid prices' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const service = await getService(runtime);
                const result: AllMids = await service.getAllMids();

                if (callback) {
                    callback({
                        text: `Retrieved mid prices for all coins`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to get all mids:', error);
                if (callback) {
                    callback({
                        text: `Failed to get all mids: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'getUserFunding',
        description: 'Get user funding information',
        similes: ['Get funding', 'Show funding', 'Funding info'],
        examples: [[{ user: 'user', content: { text: 'Show my funding' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const address = options?.address as string || runtime.getSetting('HYPERLIQUID_WALLET_ADDRESS');
                const startTime = options?.startTime as number;
                const endTime = options?.endTime as number;

                if (!address) {
                    throw new Error('Wallet address is required');
                }
                if (!startTime) {
                    throw new Error('Start time is required');
                }

                const service = await getService(runtime);
                const result: UserFunding = await service.getUserFunding(address, startTime, endTime);

                if (callback) {
                    callback({
                        text: `Retrieved funding information`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to get user funding:', error);
                if (callback) {
                    callback({
                        text: `Failed to get user funding: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'getUserNonFundingLedgerUpdates',
        description: 'Get user non-funding ledger updates',
        similes: ['Get ledger updates', 'Show ledger', 'Ledger info'],
        examples: [[{ user: 'user', content: { text: 'Show my ledger updates' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const address = options?.address as string || runtime.getSetting('HYPERLIQUID_WALLET_ADDRESS');
                const startTime = options?.startTime as number;
                const endTime = options?.endTime as number;

                if (!address) {
                    throw new Error('Wallet address is required');
                }
                if (!startTime) {
                    throw new Error('Start time is required');
                }

                const service = await getService(runtime);
                const result: UserNonFundingLedgerUpdates = await service.getUserNonFundingLedgerUpdates(address, startTime, endTime);

                if (callback) {
                    callback({
                        text: `Retrieved ledger updates`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to get ledger updates:', error);
                if (callback) {
                    callback({
                        text: `Failed to get ledger updates: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    },
    {
        name: 'getFundingHistory',
        description: 'Get funding history for a coin',
        similes: ['Get coin funding', 'Show funding history', 'Coin funding'],
        examples: [[{ user: 'user', content: { text: 'Show BTC funding history' } }]],
        validate: async () => true,
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: Record<string, unknown>, callback?: HandlerCallback): Promise<boolean> => {
            try {
                const coin = options?.coin as string;
                const startTime = options?.startTime as number;
                const endTime = options?.endTime as number;

                if (!coin) {
                    throw new Error('Coin is required');
                }
                if (!startTime) {
                    throw new Error('Start time is required');
                }

                const service = await getService(runtime);
                const result: FundingHistory = await service.getFundingHistory(coin, startTime, endTime);

                if (callback) {
                    callback({
                        text: `Retrieved funding history for ${coin}`,
                        content: result
                    });
                }
                return true;
            } catch (error) {
                elizaLogger.error('Failed to get funding history:', error);
                if (callback) {
                    callback({
                        text: `Failed to get funding history: ${(error as Error).message}`,
                        content: { error: (error as Error).message }
                    });
                }
                return false;
            }
        }
    }
];
