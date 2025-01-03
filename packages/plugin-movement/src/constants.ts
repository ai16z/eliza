export const MOVE_DECIMALS = 8;

export const MOVEMENT_NETWORK_CONFIG = {
    mainnet: {
        fullnode: 'https://mainnet.movementnetwork.xyz/v1',
        chainId: '126',
        name: 'Movement Mainnet',
        explorerNetwork: 'mainnet'
    },
    bardock: {
        fullnode: 'https://aptos.testnet.bardock.movementlabs.xyz/v1',
        chainId: '250',
        name: 'Movement Bardock Testnet',
        explorerNetwork: 'bardock+testnet'
    }
} as const;

export const DEFAULT_NETWORK = 'bardock';
export const MOVEMENT_EXPLORER_URL = 'https://explorer.movementnetwork.xyz/txn';