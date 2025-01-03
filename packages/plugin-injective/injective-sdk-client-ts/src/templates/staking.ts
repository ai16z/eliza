// templates/staking.ts
import { ResponseTemplate, CoinTemplate, PaginationTemplate } from './templates/types';

export interface StakingModuleParams {
    unbondingTime: string;
    maxValidators: number;
    maxEntries: number;
    historicalEntries: number;
    bondDenom: string;
    minCommissionRate: string;
}

export interface ValidatorDescription {
    moniker: string;
    identity: string;
    website: string;
    securityContact: string;
    details: string;
}

export interface ValidatorCommission {
    commissionRates: {
        rate: string;
        maxRate: string;
        maxChangeRate: string;
    };
    updateTime: string;
}

export interface Validator {
    operatorAddress: string;
    consensusPubkey: string;
    jailed: boolean;
    status: string;
    tokens: string;
    delegatorShares: string;
    description: ValidatorDescription;
    unbondingHeight: string;
    unbondingTime: string;
    commission: ValidatorCommission;
    minSelfDelegation: string;
}

export const stakingTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "unbondingTime": "{{unbondingTime}}",
    "maxValidators": {{maxValidators}},
    "maxEntries": {{maxEntries}},
    "historicalEntries": {{historicalEntries}},
    "bondDenom": "{{bondDenom}}",
    "minCommissionRate": "{{minCommissionRate}}"
}
\`\`\`
`,
        description: `
Extract the following staking parameters:
- Unbonding time duration
- Maximum validators
- Maximum entries
- Historical entries count
- Bond denomination
- Minimum commission rate
`
    } as ResponseTemplate,

    validator: {
        template: `
\`\`\`json
{
    "operatorAddress": "{{operatorAddress}}",
    "consensusPubkey": "{{consensusPubkey}}",
    "jailed": {{jailed}},
    "status": "{{status}}",
    "tokens": "{{tokens}}",
    "delegatorShares": "{{delegatorShares}}",
    "description": {
        "moniker": "{{moniker}}",
        "identity": "{{identity}}",
        "website": "{{website}}",
        "securityContact": "{{securityContact}}",
        "details": "{{details}}"
    },
    "unbondingHeight": "{{unbondingHeight}}",
    "unbondingTime": "{{unbondingTime}}",
    "commission": {
        "commissionRates": {
            "rate": "{{rate}}",
            "maxRate": "{{maxRate}}",
            "maxChangeRate": "{{maxChangeRate}}"
        },
        "updateTime": "{{updateTime}}"
    },
    "minSelfDelegation": "{{minSelfDelegation}}"
}
\`\`\`
`,
        description: `
Extract the following validator information:
- Validator addresses and keys
- Status and tokens
- Description and commission details
- Unbonding information
`
    } as ResponseTemplate,

    delegation: {
        template: `
\`\`\`json
{
    "delegation": {
        "delegatorAddress": "{{delegatorAddress}}",
        "validatorAddress": "{{validatorAddress}}",
        "shares": "{{shares}}"
    },
    "balance": {
        "denom": "{{denom}}",
        "amount": "{{amount}}"
    }
}
\`\`\`
`,
        description: `
Extract the following delegation information:
- Delegator and validator addresses
- Delegation shares
- Balance details
`
    } as ResponseTemplate,

    unbondingDelegation: {
        template: `
\`\`\`json
{
    "delegatorAddress": "{{delegatorAddress}}",
    "validatorAddress": "{{validatorAddress}}",
    "entries": [
        {
            "creationHeight": "{{creationHeight}}",
            "completionTime": "{{completionTime}}",
            "initialBalance": "{{initialBalance}}",
            "balance": "{{balance}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following unbonding delegation information:
- Delegator and validator addresses
- Unbonding entries with timing
- Balance information
`
    } as ResponseTemplate,

    redelegation: {
        template: `
\`\`\`json
{
    "delegatorAddress": "{{delegatorAddress}}",
    "validatorSrcAddress": "{{validatorSrcAddress}}",
    "validatorDstAddress": "{{validatorDstAddress}}",
    "entries": [
        {
            "creationHeight": "{{creationHeight}}",
            "completionTime": "{{completionTime}}",
            "initialBalance": "{{initialBalance}}",
            "sharesDst": "{{sharesDst}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following redelegation information:
- Delegator address
- Source and destination validator addresses
- Redelegation entries with timing
`
    } as ResponseTemplate,

    pool: {
        template: `
\`\`\`json
{
    "notBondedTokens": "{{notBondedTokens}}",
    "bondedTokens": "{{bondedTokens}}"
}
\`\`\`
`,
        description: `
Extract the following pool information:
- Not bonded tokens amount
- Bonded tokens amount
`
    } as ResponseTemplate,

    validatorDelegations: {
        template: `
\`\`\`json
{
    "delegations": [
        {
            "delegatorAddress": "{{delegatorAddress}}",
            "validatorAddress": "{{validatorAddress}}",
            "shares": "{{shares}}"
        }
    ],
    "pagination": {
        "nextKey": "{{nextKey}}",
        "total": "{{total}}"
    }
}
\`\`\`
`,
        description: `
Extract the following validator delegations:
- List of delegations to validator
- Pagination details
`
    } as ResponseTemplate,

    validators: {
        template: `
\`\`\`json
{
    "validators": [
        {
            "operatorAddress": "{{operatorAddress}}",
            "status": "{{status}}",
            "tokens": "{{tokens}}",
            "delegatorShares": "{{delegatorShares}}",
            "description": {
                "moniker": "{{moniker}}"
            },
            "commission": {
                "commissionRates": {
                    "rate": "{{rate}}"
                }
            }
        }
    ],
    "pagination": {
        "nextKey": "{{nextKey}}",
        "total": "{{total}}"
    }
}
\`\`\`
`,
        description: `
Extract the following validators list:
- Array of validators with key details
- Pagination information
`
    } as ResponseTemplate
};