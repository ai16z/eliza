import { describe, it, expect, beforeEach } from 'vitest';
import { HttpTransport } from '../../src/transport/http.transport';
import { InfoType } from '../../src/types/constants';
import { elizaLogger } from '@elizaos/core';

describe('HttpTransport Integration', () => {
    let transport: HttpTransport;

    beforeEach(() => {
        const baseUrl = process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz';
        const walletAddress = process.env.HYPERLIQUID_WALLET_ADDRESS || '';
        elizaLogger.info('Setting up HTTP transport', { baseUrl, walletAddress });

        transport = new HttpTransport({
            baseUrl,
            walletAddress,
            isMainnet: true,
            timeout: 10000
        });
    });

    describe('public endpoints', () => {
        it('should get meta information', async () => {
            elizaLogger.info('Testing getMeta endpoint');
            const response = await transport.infoRequest({
                type: InfoType.META
            });
            elizaLogger.debug('Meta response received', { response });
            expect(response).toBeDefined();
        });

        it('should get all mids', async () => {
            elizaLogger.info('Testing getAllMids endpoint');
            const response = await transport.infoRequest({
                type: InfoType.ALL_MIDS
            });
            elizaLogger.debug('AllMids response received', { response });
            expect(response).toBeDefined();
        });

        it('should get meta and asset contexts', async () => {
            elizaLogger.info('Testing getMetaAndAssetCtxs endpoint');
            const response = await transport.infoRequest({
                type: InfoType.PERPS_META_AND_ASSET_CTXS
            });
            elizaLogger.debug('MetaAndAssetCtxs response received', { response });
            expect(response).toBeDefined();
        });
    });

    describe('user-specific endpoints', () => {
        beforeEach(() => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                elizaLogger.warn('Skipping user-specific tests: HYPERLIQUID_WALLET_ADDRESS not set');
            }
        });

        it('should get clearing house state', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            elizaLogger.info('Testing getClearingHouseState endpoint', {
                user: process.env.HYPERLIQUID_WALLET_ADDRESS
            });
            const response = await transport.infoRequest({
                type: InfoType.CLEARINGHOUSE_STATE,
                user: process.env.HYPERLIQUID_WALLET_ADDRESS
            });
            elizaLogger.debug('ClearingHouseState response received', { response });
            expect(response).toBeDefined();
        });

        it('should get open orders', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            elizaLogger.info('Testing getOpenOrders endpoint', {
                user: process.env.HYPERLIQUID_WALLET_ADDRESS
            });
            const response = await transport.infoRequest({
                type: InfoType.OPEN_ORDERS,
                user: process.env.HYPERLIQUID_WALLET_ADDRESS
            });
            elizaLogger.debug('OpenOrders response received', { response });
            expect(response).toBeDefined();
        });

        it('should get user fills', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            elizaLogger.info('Testing getUserFills endpoint', {
                user: process.env.HYPERLIQUID_WALLET_ADDRESS
            });
            const response = await transport.infoRequest({
                type: InfoType.USER_FILLS,
                user: process.env.HYPERLIQUID_WALLET_ADDRESS
            });
            elizaLogger.debug('UserFills response received', { response });
            expect(response).toBeDefined();
        });

        it('should get user fills by time', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            const startTime = Date.now() - 86400000; // 24 hours ago
            elizaLogger.info('Testing getUserFillsByTime endpoint', {
                user: process.env.HYPERLIQUID_WALLET_ADDRESS,
                startTime
            });
            const response = await transport.infoRequest({
                type: InfoType.USER_FILLS_BY_TIME,
                user: process.env.HYPERLIQUID_WALLET_ADDRESS,
                startTime
            });
            elizaLogger.debug('UserFillsByTime response received', { response });
            expect(response).toBeDefined();
        });

        it('should get user funding', async () => {
            if (!process.env.HYPERLIQUID_WALLET_ADDRESS) {
                return;
            }

            const startTime = Date.now() - 86400000; // 24 hours ago
            elizaLogger.info('Testing getUserFunding endpoint', {
                user: process.env.HYPERLIQUID_WALLET_ADDRESS,
                startTime
            });
            const response = await transport.infoRequest({
                type: InfoType.USER_FUNDING,
                user: process.env.HYPERLIQUID_WALLET_ADDRESS,
                startTime
            });
            elizaLogger.debug('UserFunding response received', { response });
            expect(response).toBeDefined();
        });

        it('should get funding history', async () => {
            const startTime = Date.now() - 86400000; // 24 hours ago
            elizaLogger.info('Testing getFundingHistory endpoint', {
                startTime,
                coin: 'HYPE'
            });
            const response = await transport.infoRequest({
                type: InfoType.FUNDING_HISTORY,
                startTime,
                coin: 'HYPE'
            });
            elizaLogger.debug('FundingHistory response received', { response });
            expect(response).toBeDefined();
        });
    });
});