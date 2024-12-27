import { ethers } from 'ethers';
import { encode } from '@msgpack/msgpack';

const PHANTOM_DOMAIN = {
    name: 'Exchange',
    version: '1',
    chainId: 1337,
    verifyingContract: '0x0000000000000000000000000000000000000000'
};

const AGENT_TYPES = {
    Agent: [
        { name: 'source', type: 'string' },
        { name: 'connectionId', type: 'bytes32' }
    ]
};

export async function signL1Action(
    wallet: ethers.Wallet,
    action: unknown,
    vaultAddress: string | null,
    nonce: number,
    isMainnet: boolean
): Promise<{ r: string; s: string; v: number }> {
    const msgPackBytes = encode(action);
    const additionalBytesLength = vaultAddress === null ? 9 : 29;
    const data = new Uint8Array(msgPackBytes.length + additionalBytesLength);
    data.set(msgPackBytes);
    const view = new DataView(data.buffer);
    view.setBigUint64(msgPackBytes.length, BigInt(nonce), false);

    if (vaultAddress === null) {
        view.setUint8(msgPackBytes.length + 8, 0);
    } else {
        view.setUint8(msgPackBytes.length + 8, 1);
        data.set(ethers.getBytes(vaultAddress), msgPackBytes.length + 9);
    }

    const hash = ethers.keccak256(data);
    const phantomAgent = { source: isMainnet ? 'a' : 'b', connectionId: hash };

    const signature = await wallet.signTypedData(
        PHANTOM_DOMAIN,
        AGENT_TYPES,
        phantomAgent
    );

    return ethers.Signature.from(signature);
}

export async function signUserSignedAction(
    wallet: ethers.Wallet,
    action: any,
    payloadTypes: Array<{ name: string; type: string }>,
    primaryType: string,
    isMainnet: boolean,
): Promise<{ r: string; s: string; v: number }> {
    action.signatureChainId = '0x66eee';
    action.hyperliquidChain = isMainnet ? 'Mainnet' : 'Testnet';
    const data = {
        domain: {
            name: 'HyperliquidSignTransaction',
            version: '1',
            chainId: 421614,
            verifyingContract: '0x0000000000000000000000000000000000000000',
        },
        types: {
            [primaryType]: payloadTypes,
        },
        primaryType: primaryType,
        message: action,
    };
    return signInner(wallet, data);
}

async function signInner(
    wallet: ethers.Wallet,
    data: any,
): Promise<{ r: string; s: string; v: number }> {
    const signature = await wallet.signTypedData(
        data.domain,
        data.types,
        data.message,
    );
    return ethers.Signature.from(signature);
}

export function getWalletFromPrivateKey(privateKey: string): string {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
}

export function floatToWire(x: number): string {
    const rounded = x.toFixed(8);
    if (Math.abs(parseFloat(rounded) - x) >= 1e-12) {
        throw new Error(`floatToWire causes rounding: ${x}`);
    }
    let normalized = rounded.replace(/\.?0+$/, '');
    if (normalized === '-0') normalized = '0';
    return normalized;
}

export function floatToIntForHashing(x: number): number {
    return floatToInt(x, 8);
}

export function floatToUsdInt(x: number): number {
    return floatToInt(x, 6);
}

function floatToInt(x: number, power: number): number {
    const withDecimals = x * Math.pow(10, power);
    if (Math.abs(Math.round(withDecimals) - withDecimals) >= 1e-3) {
        throw new Error(`floatToInt causes rounding: ${x}`);
    }
    return Math.round(withDecimals);
}

export function getTimestampMs(): number {
    return Date.now();
}