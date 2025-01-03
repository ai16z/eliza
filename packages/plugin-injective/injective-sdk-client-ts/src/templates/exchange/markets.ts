import { ResponseTemplate } from '../templates/types';

export const marketTemplates = {
    spotMarket: {
        template: `
\`\`\`json
{
    "marketId": "{{marketId}}",
    "marketStatus": "{{marketStatus}}",
    "ticker": "{{ticker}}",
    "baseDenom": "{{baseDenom}}",
    "quoteDenom": "{{quoteDenom}}",
    "makerFeeRate": "{{makerFeeRate}}",
    "takerFeeRate": "{{takerFeeRate}}",
    "serviceProviderFee": "{{serviceProviderFee}}",
    "minPriceTickSize": "{{minPriceTickSize}}",
    "minQuantityTickSize": "{{minQuantityTickSize}}"
}
\`\`\`
`,
        description: `
Extract the following spot market information:
- Market ID and status
- Ticker symbol
- Base and quote denominations
- Fee rates (maker, taker, service provider)
- Minimum tick sizes (price and quantity)
`
    } as ResponseTemplate,

    derivativeMarket: {
        template: `
\`\`\`json
{
    "marketId": "{{marketId}}",
    "status": "{{status}}",
    "ticker": "{{ticker}}",
    "oracleBase": "{{oracleBase}}",
    "oracleQuote": "{{oracleQuote}}",
    "quoteDenom": "{{quoteDenom}}",
    "makerFeeRate": "{{makerFeeRate}}",
    "takerFeeRate": "{{takerFeeRate}}",
    "initialMarginRatio": "{{initialMarginRatio}}",
    "maintenanceMarginRatio": "{{maintenanceMarginRatio}}",
    "isPerpetual": {{isPerpetual}},
    "expiryTime": "{{expiryTime}}",
    "oracleScaleFactor": {{oracleScaleFactor}},
    "oracleType": "{{oracleType}}"
}
\`\`\`
`,
        description: `
Extract the following derivative market information:
- Market identification and status
- Market specifications (ticker, oracle details)
- Fee structure
- Margin requirements
- Market type and expiry details
`
    } as ResponseTemplate
};