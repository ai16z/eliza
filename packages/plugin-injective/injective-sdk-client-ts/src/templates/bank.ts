import { ResponseTemplate, CoinTemplate, PaginationTemplate } from './templates/types';

export interface SendEnabled {
    denom: string;
    enabled: boolean;
}

export interface BankModuleParams {
    sendEnabled: SendEnabled[];
    defaultSendEnabled: boolean;
}

export interface DenomUnit {
    denom: string;
    exponent: number;
    aliases: string[];
}

export interface DenomMetadata {
    description: string;
    denomUnits: DenomUnit[];
    base: string;
    display: string;
    name: string;
    symbol: string;
    uri: string;
    uriHash: string;
}

export interface DenomOwner {
    address: string;
    balance: CoinTemplate;
}

export const bankTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "sendEnabled": [
        {
            "denom": "{{denom}}",
            "enabled": {{enabled}}
        }
    ],
    "defaultSendEnabled": {{defaultSendEnabled}}
}
\`\`\`
`,
        description: `
Extract the following bank parameters:
- Send enabled denominations and their status
- Default send enabled status
`
    } as ResponseTemplate,

    balance: {
        template: `
\`\`\`json
{
    "balance": {
        "denom": "{{denom}}",
        "amount": "{{amount}}"
    }
}
\`\`\`
`,
        description: `
Extract the following balance information:
- Token denomination
- Token amount
`
    } as ResponseTemplate,

    balances: {
        template: `
\`\`\`json
{
    "balances": [
        {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
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
Extract the following balances information:
- List of token balances
- Pagination details
`
    } as ResponseTemplate,

    totalSupply: {
        template: `
\`\`\`json
{
    "supply": [
        {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
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
Extract the following supply information:
- List of token supplies
- Pagination details
`
    } as ResponseTemplate,

    denomMetadata: {
        template: `
\`\`\`json
{
    "description": "{{description}}",
    "denomUnits": [
        {
            "denom": "{{denom}}",
            "exponent": {{exponent}},
            "aliases": []
        }
    ],
    "base": "{{base}}",
    "display": "{{display}}",
    "name": "{{name}}",
    "symbol": "{{symbol}}",
    "uri": "{{uri}}",
    "uriHash": "{{uriHash}}"
}
\`\`\`
`,
        description: `
Extract the following denomination metadata:
- Description
- Denomination units (denom, exponent, aliases)
- Base and display denominations
- Name and symbol
- URI information
`
    } as ResponseTemplate,

    denomOwners: {
        template: `
\`\`\`json
{
    "denomOwners": [
        {
            "address": "{{address}}",
            "balance": {
                "denom": "{{denom}}",
                "amount": "{{amount}}"
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
Extract the following denomination owners information:
- List of owners and their balances
- Pagination details
`
    } as ResponseTemplate
};