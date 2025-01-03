// templates/oracle.ts
import { ResponseTemplate } from './templates/types';

export interface OracleModuleParams {
    pyth: {
        minValidPeriod: number;
        priceExponent: number;
    };
    band: {
        ibc: {
            requestTimeout: number;
            oracleScriptId: number;
            askCount: number;
            minCount: number;
            feeAmount: string;
            prepareGas: number;
            executeGas: number;
        };
    };
    coinbase: {
        apiTimeout: number;
    };
    providerTimeoutPeriod: number;
}

export interface OraclePrice {
    price: string;
    timestamp: string;
}

export interface OracleVotePeriod {
    blockHeight: string;
    remainingBlocks: string;
}

export const oracleTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "pyth": {
        "minValidPeriod": {{minValidPeriod}},
        "priceExponent": {{priceExponent}}
    },
    "band": {
        "ibc": {
            "requestTimeout": {{requestTimeout}},
            "oracleScriptId": {{oracleScriptId}},
            "askCount": {{askCount}},
            "minCount": {{minCount}},
            "feeAmount": "{{feeAmount}}",
            "prepareGas": {{prepareGas}},
            "executeGas": {{executeGas}}
        }
    },
    "coinbase": {
        "apiTimeout": {{apiTimeout}}
    },
    "providerTimeoutPeriod": {{providerTimeoutPeriod}}
}
\`\`\`
`,
        description: `
Extract the following oracle parameters:
- Pyth oracle configuration
- Band Protocol settings
- Coinbase API settings
- Provider timeout period
`
    } as ResponseTemplate,

    price: {
        template: `
\`\`\`json
{
    "price": "{{price}}",
    "timestamp": "{{timestamp}}"
}
\`\`\`
`,
        description: `
Extract the following price information:
- Price value
- Price timestamp
`
    } as ResponseTemplate,

    prices: {
        template: `
\`\`\`json
{
    "prices": [
        {
            "symbol": "{{symbol}}",
            "price": "{{price}}",
            "timestamp": "{{timestamp}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following prices information:
- Array of price data
- Symbol, price, and timestamp for each entry
`
    } as ResponseTemplate,

    votePeriod: {
        template: `
\`\`\`json
{
    "blockHeight": "{{blockHeight}}",
    "remainingBlocks": "{{remainingBlocks}}"
}
\`\`\`
`,
        description: `
Extract the following vote period information:
- Current block height
- Remaining blocks in period
`
    } as ResponseTemplate
};