// templates/wasm.ts
import { ResponseTemplate, PaginationTemplate } from './templates/types';

export interface ContractInfo {
    codeId: number;
    creator: string;
    admin: string;
    label: string;
    created: {
        blockHeight: number;
        txIndex: number;
    };
    ibcPortId: string;
}

export interface CodeInfoResponse {
    codeId: number;
    creator: string;
    dataHash: Uint8Array;
    instantiatePermission: {
        permission: string;
        address: string;
    };
}

export interface ContractCodeHistoryEntry {
    operation: string;
    codeId: number;
    updated: {
        blockHeight: number;
        txIndex: number;
    };
    msg: any;
}

export const wasmTemplates = {
    contractInfo: {
        template: `
\`\`\`json
{
    "codeId": {{codeId}},
    "creator": "{{creator}}",
    "admin": "{{admin}}",
    "label": "{{label}}",
    "created": {
        "blockHeight": {{blockHeight}},
        "txIndex": {{txIndex}}
    },
    "ibcPortId": "{{ibcPortId}}"
}
\`\`\`
`,
        description: `
Extract the following contract information:
- Code and creator details
- Admin and label
- Creation details
- IBC port ID
`
    } as ResponseTemplate,

    contractState: {
        template: `
\`\`\`json
{
    "models": [
        {
            "key": "{{key}}",
            "value": "{{value}}"
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
Extract the following contract state:
- Key-value pairs of contract state
- Pagination information
`
    } as ResponseTemplate,

    contractAccountsBalance: {
        template: `
\`\`\`json
{
    "accounts": [
        {
            "account": "{{account}}",
            "balances": [
                {
                    "denom": "{{denom}}",
                    "amount": "{{amount}}"
                }
            ]
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
Extract the following contract accounts balance:
- List of accounts and their balances
- Pagination details
`
    } as ResponseTemplate,

    contractHistory: {
        template: `
\`\`\`json
{
    "entriesList": [
        {
            "operation": "{{operation}}",
            "codeId": {{codeId}},
            "updated": {
                "blockHeight": {{blockHeight}},
                "txIndex": {{txIndex}}
            },
            "msg": {{msg}}
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
Extract the following contract history:
- List of historical operations
- Code updates and timing
- Operation messages
`
    } as ResponseTemplate,

    smartContractState: {
        template: `
\`\`\`json
{
    "data": "{{data}}"
}
\`\`\`
`,
        description: `
Extract the following smart contract state:
- Contract state data
`
    } as ResponseTemplate,

    rawContractState: {
        template: `
\`\`\`json
{
    "data": "{{data}}"
}
\`\`\`
`,
        description: `
Extract the following raw contract state:
- Raw contract state data
`
    } as ResponseTemplate,

    contractCodes: {
        template: `
\`\`\`json
{
    "codeInfosList": [
        {
            "codeId": {{codeId}},
            "creator": "{{creator}}",
            "dataHash": "{{dataHash}}",
            "instantiatePermission": {
                "permission": "{{permission}}",
                "address": "{{address}}"
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
Extract the following contract codes:
- List of code information
- Code permissions
- Pagination details
`
    } as ResponseTemplate,

    contractCode: {
        template: `
\`\`\`json
{
    "codeInfo": {
        "codeId": {{codeId}},
        "creator": "{{creator}}",
        "dataHash": "{{dataHash}}",
        "instantiatePermission": {
            "permission": "{{permission}}",
            "address": "{{address}}"
        }
    },
    "data": "{{data}}"
}
\`\`\`
`,
        description: `
Extract the following contract code:
- Code information details
- Binary data
`
    } as ResponseTemplate,

    contractCodeContracts: {
        template: `
\`\`\`json
{
    "contractsList": ["{{contract}}"],
    "pagination": {
        "nextKey": "{{nextKey}}",
        "total": "{{total}}"
    }
}
\`\`\`
`,
        description: `
Extract the following code contracts:
- List of contracts using code ID
- Pagination information
`
    } as ResponseTemplate
};