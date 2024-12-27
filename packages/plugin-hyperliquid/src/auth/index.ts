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

import { elizaLogger } from '@elizaos/core';
import { ethers } from 'ethers';
import { encode } from '@msgpack/msgpack';
import { L1Action, L1ActionType } from '../types/api';

export async function signL1Action(action: L1Action, privateKey: string): Promise<string> {
    try {
        elizaLogger.info('Signing L1 action:', action);
        const wallet = new ethers.Wallet(privateKey);
        const encodedAction = encode(action);
        const signature = await wallet.signMessage(encodedAction);
        elizaLogger.debug('Successfully signed L1 action');
        return signature;
    } catch (error) {
        elizaLogger.error('Failed to sign L1 action:', error);
        throw new Error(`Failed to sign L1 action: ${(error as Error).message}`);
    }
}

export function deriveWalletAddress(privateKey: string): string {
    try {
        elizaLogger.info('Deriving wallet address from private key');
        const wallet = new ethers.Wallet(privateKey);
        const address = wallet.address;
        elizaLogger.debug('Successfully derived wallet address');
        return address;
    } catch (error) {
        elizaLogger.error('Failed to derive wallet address:', error);
        throw new Error(`Failed to derive wallet address: ${(error as Error).message}`);
    }
}

export async function signUserAction(action: L1ActionType, privateKey: string): Promise<string> {
    try {
        elizaLogger.debug('Signing user action:', action);
        const wallet = new ethers.Wallet(privateKey);
        const encodedAction = encode(action);
        const signature = await wallet.signMessage(encodedAction);
        elizaLogger.debug('Successfully signed user action');
        return signature;
    } catch (error) {
        elizaLogger.error('Failed to sign user action:', error);
        throw new Error(`Failed to sign user action: ${(error as Error).message}`);
    }
}
