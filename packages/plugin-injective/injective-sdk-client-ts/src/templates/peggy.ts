// templates/peggy.ts
import { ResponseTemplate, CoinTemplate } from './templates/types';

export interface PeggyModuleParams {
    bridgeEthAddress: string;
    bridgeChainId: number;
    signedValsetsWindow: number;
    signedBatchesWindow: number;
    signedClaimsWindow: number;
    targetBatchTimeout: number;
    averageBlockTime: number;
    averageEthBlockTime: number;
    slashFractionValset: string;
    slashFractionBatch: string;
    slashFractionClaim: string;
    slashFractionConflictingClaim: string;
    unbondSlashingValsetsWindow: number;
    valuateCompletionThreshold: string;
}

export interface Valset {
    nonce: number;
    members: Array<{
        power: number;
        ethereumAddress: string;
    }>;
    height: number;
}

export interface OutgoingTxBatch {
    batchNonce: number;
    batchTimeout: number;
    transactions: Array<{
        id: number;
        sender: string;
        destAddress: string;
        erc20Token: {
            contract: string;
            amount: string;
        };
        erc20Fee: {
            contract: string;
            amount: string;
        };
    }>;
    tokenContract: string;
    block: number;
}

export const peggyTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "bridgeEthAddress": "{{bridgeEthAddress}}",
    "bridgeChainId": {{bridgeChainId}},
    "signedValsetsWindow": {{signedValsetsWindow}},
    "signedBatchesWindow": {{signedBatchesWindow}},
    "signedClaimsWindow": {{signedClaimsWindow}},
    "targetBatchTimeout": {{targetBatchTimeout}},
    "averageBlockTime": {{averageBlockTime}},
    "averageEthBlockTime": {{averageEthBlockTime}},
    "slashFractionValset": "{{slashFractionValset}}",
    "slashFractionBatch": "{{slashFractionBatch}}",
    "slashFractionClaim": "{{slashFractionClaim}}",
    "slashFractionConflictingClaim": "{{slashFractionConflictingClaim}}",
    "unbondSlashingValsetsWindow": {{unbondSlashingValsetsWindow}},
    "valuateCompletionThreshold": "{{valuateCompletionThreshold}}"
}
\`\`\`
`,
        description: `
Extract the following Peggy parameters:
- Bridge configuration (Ethereum address, chain ID)
- Timing windows for signatures
- Block time averages
- Slashing parameters
- Validation thresholds
`
    } as ResponseTemplate,

    currentValset: {
        template: `
\`\`\`json
{
    "nonce": {{nonce}},
    "members": [
        {
            "power": {{power}},
            "ethereumAddress": "{{ethereumAddress}}"
        }
    ],
    "height": {{height}}
}
\`\`\`
`,
        description: `
Extract the following current valset information:
- Nonce
- Validator set members
- Block height
`
    } as ResponseTemplate,

    outgoingTxBatch: {
        template: `
\`\`\`json
{
    "batchNonce": {{batchNonce}},
    "batchTimeout": {{batchTimeout}},
    "transactions": [
        {
            "id": {{id}},
            "sender": "{{sender}}",
            "destAddress": "{{destAddress}}",
            "erc20Token": {
                "contract": "{{contract}}",
                "amount": "{{amount}}"
            },
            "erc20Fee": {
                "contract": "{{contract}}",
                "amount": "{{amount}}"
            }
        }
    ],
    "tokenContract": "{{tokenContract}}",
    "block": {{block}}
}
\`\`\`
`,
        description: `
Extract the following batch information:
- Batch identification (nonce, timeout)
- Transaction details
- Token contract information
- Block number
`
    } as ResponseTemplate,

    lastEventNonce: {
        template: `
\`\`\`json
{
    "eventNonce": {{eventNonce}}
}
\`\`\`
`,
        description: `
Extract the following event nonce information:
- Latest event nonce
`
    } as ResponseTemplate,

    lastValsetRequests: {
        template: `
\`\`\`json
{
    "valsets": [
        {
            "nonce": {{nonce}},
            "time": "{{time}}",
            "height": {{height}},
            "members": [
                {
                    "power": {{power}},
                    "ethereumAddress": "{{ethereumAddress}}"
                }
            ]
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following valset requests:
- List of recent validator sets
- Timing and height information
- Member details
`
    } as ResponseTemplate
};