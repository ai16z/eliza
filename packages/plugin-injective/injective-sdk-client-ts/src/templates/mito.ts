// templates/mito.ts
import { ResponseTemplate, CoinTemplate } from './templates/types';

export interface MitoVault {
    contractAddress: string;
    name: string;
    description: string;
    slug: string;
    tvl: string;
    lpTokenPrice: string;
    apy: string;
    status: string;
}

export interface MitoPriceSnapshot {
    timestamp: number;
    value: string;
}

export interface MitoSubscription {
    vaultAddress: string;
    holderAddress: string;
    balance: CoinTemplate;
}

export interface MitoLeaderboard {
    round: number;
    startTime: number;
    endTime: number;
    entries: Array<{
        address: string;
        score: string;
        rank: number;
    }>;
}

export const mitoTemplates = {
    vault: {
        template: `
\`\`\`json
{
    "contractAddress": "{{contractAddress}}",
    "name": "{{name}}",
    "description": "{{description}}",
    "slug": "{{slug}}",
    "tvl": "{{tvl}}",
    "lpTokenPrice": "{{lpTokenPrice}}",
    "apy": "{{apy}}",
    "status": "{{status}}"
}
\`\`\`
`,
        description: `
Extract the following vault information:
- Contract address and identification
- Vault details (name, description)
- Performance metrics (TVL, token price, APY)
- Current status
`
    } as ResponseTemplate,

    vaults: {
        template: `
\`\`\`json
{
    "vaults": [
        {
            "contractAddress": "{{contractAddress}}",
            "name": "{{name}}",
            "description": "{{description}}",
            "slug": "{{slug}}",
            "tvl": "{{tvl}}",
            "lpTokenPrice": "{{lpTokenPrice}}",
            "apy": "{{apy}}",
            "status": "{{status}}"
        }
    ],
    "pagination": {
        "total": "{{total}}",
        "nextKey": "{{nextKey}}"
    }
}
\`\`\`
`,
        description: `
Extract the following vaults list:
- Array of vaults with details
- Pagination information
`
    } as ResponseTemplate,

    priceChart: {
        template: `
\`\`\`json
{
    "snapshots": [
        {
            "timestamp": {{timestamp}},
            "value": "{{value}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following price chart information:
- Array of price snapshots
- Timestamp and value pairs
`
    } as ResponseTemplate,

    holderPortfolio: {
        template: `
\`\`\`json
{
    "vaultAddress": "{{vaultAddress}}",
    "holderAddress": "{{holderAddress}}",
    "deposits": [
        {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
        }
    ],
    "rewards": [
        {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
        }
    ],
    "totalValueLocked": "{{totalValueLocked}}",
    "profitLoss": "{{profitLoss}}"
}
\`\`\`
`,
        description: `
Extract the following portfolio information:
- Vault and holder identification
- Deposit amounts
- Reward amounts
- TVL and P&L metrics
`
    } as ResponseTemplate,

    leaderboard: {
        template: `
\`\`\`json
{
    "round": {{round}},
    "startTime": {{startTime}},
    "endTime": {{endTime}},
    "entries": [
        {
            "address": "{{address}}",
            "score": "{{score}}",
            "rank": {{rank}}
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following leaderboard information:
- Round details and timing
- Leaderboard entries with rankings
`
    } as ResponseTemplate,
    
    stakingPools: {
        template: `
\`\`\`json
{
    "pools": [
        {
            "contractAddress": "{{contractAddress}}",
            "stakedAmount": {
                "denom": "{{denom}}",
                "amount": "{{amount}}"
            },
            "rewardRate": "{{rewardRate}}",
            "totalStaked": "{{totalStaked}}",
            "unlockTime": {{unlockTime}}
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following staking pools information:
- Pool contract details
- Staking amounts and rewards
- Lock period information
`
    } as ResponseTemplate
};