// templates/insurance.ts
import { ResponseTemplate, CoinTemplate } from './templates/types';

export interface InsuranceModuleParams {
    defaultRedemptionNoticePeriodDuration: string;
    defaultUnderwritingPeriodDuration: string;
    defaultLiquidationPeriodDuration: string;
}

export interface InsuranceFund {
    marketId: string;
    depositDenom: string;
    insurancePoolTokenDenom: string;
    redemptionNoticePeriodDuration: string;
    balance: CoinTemplate;
    totalShare: string;
    marketTickSize: string;
    marketPrice: string;
    oracleBase: string;
    oracleQuote: string;
    oracleType: string;
    expiry: string;
}

export interface RedemptionSchedule {
    redemptionId: string;
    marketId: string;
    redeemer: string;
    claimableRedemptionTime: string;
    redemptionAmount: CoinTemplate;
    depositAmount: CoinTemplate;
}

export const insuranceTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "defaultRedemptionNoticePeriodDuration": "{{defaultRedemptionNoticePeriodDuration}}",
    "defaultUnderwritingPeriodDuration": "{{defaultUnderwritingPeriodDuration}}",
    "defaultLiquidationPeriodDuration": "{{defaultLiquidationPeriodDuration}}"
}
\`\`\`
`,
        description: `
Extract the following insurance parameters:
- Default redemption notice period duration
- Default underwriting period duration
- Default liquidation period duration
`
    } as ResponseTemplate,

    insuranceFund: {
        template: `
\`\`\`json
{
    "marketId": "{{marketId}}",
    "depositDenom": "{{depositDenom}}",
    "insurancePoolTokenDenom": "{{insurancePoolTokenDenom}}",
    "redemptionNoticePeriodDuration": "{{redemptionNoticePeriodDuration}}",
    "balance": {
        "denom": "{{denom}}",
        "amount": "{{amount}}"
    },
    "totalShare": "{{totalShare}}",
    "marketTickSize": "{{marketTickSize}}",
    "marketPrice": "{{marketPrice}}",
    "oracleBase": "{{oracleBase}}",
    "oracleQuote": "{{oracleQuote}}",
    "oracleType": "{{oracleType}}",
    "expiry": "{{expiry}}"
}
\`\`\`
`,
        description: `
Extract the following insurance fund information:
- Market identification
- Fund configuration
- Balance and share information
- Market and oracle details
`
    } as ResponseTemplate,

    insuranceFunds: {
        template: `
\`\`\`json
{
    "funds": [
        {
            "marketId": "{{marketId}}",
            "depositDenom": "{{depositDenom}}",
            "insurancePoolTokenDenom": "{{insurancePoolTokenDenom}}",
            "redemptionNoticePeriodDuration": "{{redemptionNoticePeriodDuration}}",
            "balance": {
                "denom": "{{denom}}",
                "amount": "{{amount}}"
            },
            "totalShare": "{{totalShare}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following insurance funds list:
- Array of insurance funds with details
- Fund balances and configurations
`
    } as ResponseTemplate,

    estimatedRedemptions: {
        template: `
\`\`\`json
{
    "amount": {
        "denom": "{{denom}}",
        "amount": "{{amount}}"
    }
}
\`\`\`
`,
        description: `
Extract the following estimated redemption information:
- Redemption amount details
`
    } as ResponseTemplate,

    pendingRedemptions: {
        template: `
\`\`\`json
{
    "redemptions": [
        {
            "redemptionId": "{{redemptionId}}",
            "marketId": "{{marketId}}",
            "redeemer": "{{redeemer}}",
            "claimableRedemptionTime": "{{claimableRedemptionTime}}",
            "redemptionAmount": {
                "denom": "{{redemptionDenom}}",
                "amount": "{{redemptionAmount}}"
            },
            "depositAmount": {
                "denom": "{{depositDenom}}",
                "amount": "{{depositAmount}}"
            }
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following pending redemptions information:
- Array of redemption schedules
- Redemption details and timing
- Amount information
`
    } as ResponseTemplate
};