import { describe, it, expect, beforeEach } from 'vitest';
import { ethers } from 'ethers';
import {
    signL1Action,
    signUserSignedAction,
    getWalletFromPrivateKey,
    floatToWire,
    floatToIntForHashing,
    floatToUsdInt,
    getTimestampMs
} from '../src/utils/signing';

describe('Signing Utils', () => {
    let testWallet: ethers.Wallet;

    beforeEach(() => {
        // Skip tests if private key is not set
        if (!process.env.HYPERLIQUID_PRIVATE_KEY) {
            console.warn('Skipping signing tests: HYPERLIQUID_PRIVATE_KEY not set');
            return;
        }
        testWallet = new ethers.Wallet(process.env.HYPERLIQUID_PRIVATE_KEY);
    });

    describe('getWalletFromPrivateKey', () => {
        it('should derive the correct wallet address', () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY) return;
            const address = getWalletFromPrivateKey(process.env.HYPERLIQUID_PRIVATE_KEY);
            expect(address).toBe(testWallet.address);
        });
    });

    describe('signL1Action', () => {
        it('should sign an L1 action correctly', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY) return;
            const action = {
                type: 'order',
                orders: [{
                    a: 0,
                    b: true,
                    p: '50000',
                    s: '0.1',
                    r: false
                }]
            };

            const signature = await signL1Action(
                testWallet,
                action,
                null,
                1,
                true
            );

            expect(signature).toHaveProperty('r');
            expect(signature).toHaveProperty('s');
            expect(signature).toHaveProperty('v');
            expect(typeof signature.r).toBe('string');
            expect(typeof signature.s).toBe('string');
            expect(typeof signature.v).toBe('number');
        });
    });

    describe('signUserSignedAction', () => {
        it('should sign a user action correctly', async () => {
            if (!process.env.HYPERLIQUID_PRIVATE_KEY) return;
            const action = {
                destination: '0x1234567890123456789012345678901234567890',
                amount: '1000',
                time: Math.floor(Date.now() / 1000)
            };

            const payloadTypes = [
                { name: 'hyperliquidChain', type: 'string' },
                { name: 'destination', type: 'string' },
                { name: 'amount', type: 'string' },
                { name: 'time', type: 'uint64' }
            ];

            const signature = await signUserSignedAction(
                testWallet,
                action,
                payloadTypes,
                'HyperliquidTransaction:UsdSend',
                true
            );

            expect(signature).toHaveProperty('r');
            expect(signature).toHaveProperty('s');
            expect(signature).toHaveProperty('v');
            expect(typeof signature.r).toBe('string');
            expect(typeof signature.s).toBe('string');
            expect(typeof signature.v).toBe('number');
        });
    });

    describe('floatToWire', () => {
        it('should convert float to wire format correctly', () => {
            expect(floatToWire(123.456)).toBe('123.456');
            expect(floatToWire(123.0)).toBe('123');
            expect(floatToWire(-0)).toBe('0');
            expect(floatToWire(0.00100)).toBe('0.001');
        });

        it('should throw on precision loss', () => {
            expect(() => floatToWire(1/3)).toThrow('floatToWire causes rounding');
        });
    });

    describe('floatToIntForHashing', () => {
        it('should convert float to int for hashing correctly', () => {
            expect(floatToIntForHashing(1.23456789)).toBe(123456789);
            expect(floatToIntForHashing(0.001)).toBe(100000);
        });

        it('should throw on precision loss', () => {
            expect(() => floatToIntForHashing(1/3)).toThrow('floatToInt causes rounding');
        });
    });

    describe('floatToUsdInt', () => {
        it('should convert float to USD int correctly', () => {
            expect(floatToUsdInt(1.23456)).toBe(1234560);
            expect(floatToUsdInt(0.001)).toBe(1000);
        });

        it('should throw on precision loss', () => {
            expect(() => floatToUsdInt(1/3)).toThrow('floatToInt causes rounding');
        });
    });

    describe('getTimestampMs', () => {
        it('should return current timestamp in milliseconds', () => {
            const timestamp = getTimestampMs();
            expect(typeof timestamp).toBe('number');
            expect(timestamp).toBeLessThanOrEqual(Date.now());
            expect(timestamp).toBeGreaterThan(Date.now() - 1000);
        });
    });
});