// templates/distribution.ts
import { ResponseTemplate, CoinTemplate } from './templates/types';

export interface DistributionModuleParams {
    communityTax: string;
    baseProposerReward: string;
    bonusProposerReward: string;
    withdrawAddrEnabled: boolean;
}

export interface ValidatorRewards {
    validatorAddress: string;
    rewards: CoinTemplate[];
}

export interface DelegatorReward {
    validatorAddress: string;
    reward: CoinTemplate[];
}

export const distributionTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "communityTax": "{{communityTax}}",
    "baseProposerReward": "{{baseProposerReward}}",
    "bonusProposerReward": "{{bonusProposerReward}}",
    "withdrawAddrEnabled": {{withdrawAddrEnabled}}
}
\`\`\`
`,
        description: `
Extract the following distribution parameters:
- Community tax rate
- Base proposer reward
- Bonus proposer reward
- Withdrawal address enabled status
`
    } as ResponseTemplate,

    delegatorRewardsForValidator: {
        template: `
\`\`\`json
{
    "rewards": [
        {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following delegator rewards:
- List of rewards per denomination
`
    } as ResponseTemplate,

    delegatorRewards: {
        template: `
\`\`\`json
{
    "rewards": [
        {
            "validatorAddress": "{{validatorAddress}}",
            "reward": [
                {
                    "denom": "{{denom}}",
                    "amount": "{{amount}}"
                }
            ]
        }
    ],
    "total": [
        {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following delegator rewards information:
- List of rewards per validator
- Total rewards per denomination
`
    } as ResponseTemplate,

    validatorOutstandingRewards: {
        template: `
\`\`\`json
{
    "rewards": {
        "rewards": [
            {
                "denom": "{{denom}}",
                "amount": "{{amount}}"
            }
        ]
    }
}
\`\`\`
`,
        description: `
Extract the following validator outstanding rewards:
- List of outstanding rewards per denomination
`
    } as ResponseTemplate,

    validatorCommission: {
        template: `
\`\`\`json
{
    "commission": {
        "commission": [
            {
                "denom": "{{denom}}",
                "amount": "{{amount}}"
            }
        ]
    }
}
\`\`\`
`,
        description: `
Extract the following validator commission information:
- List of commission rewards per denomination
`
    } as ResponseTemplate,

    withdrawAddress: {
        template: `
\`\`\`json
{
    "withdrawAddress": "{{withdrawAddress}}"
}
\`\`\`
`,
        description: `
Extract the following withdrawal address information:
- Withdrawal address
`
    } as ResponseTemplate
};