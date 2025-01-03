export const tradeTemplates = {
    trade: {
        template: `
\`\`\`json
{
    "orderHash": "{{orderHash}}",
    "subaccountId": "{{subaccountId}}",
    "marketId": "{{marketId}}",
    "tradeExecutionType": "{{tradeExecutionType}}",
    "positionDelta": {
        "tradeDirection": "{{tradeDirection}}",
        "executionPrice": "{{executionPrice}}",
        "executionQuantity": "{{executionQuantity}}",
        "executionMargin": "{{executionMargin}}"
    },
    "payout": "{{payout}}",
    "fee": "{{fee}}",
    "executedAt": "{{executedAt}}"
}
\`\`\`
`,
        description: `
Extract the following trade information:
- Order and market identification
- Trade execution details
- Position changes
- Financial impact (payout, fees)
- Execution timestamp
`
    } as ResponseTemplate,

    tradeHistory: {
        template: `
\`\`\`json
{
    "trades": [
        {
            "orderHash": "{{orderHash}}",
            "subaccountId": "{{subaccountId}}",
            "marketId": "{{marketId}}",
            "tradeExecutionType": "{{tradeExecutionType}}",
            "positionDelta": {
                "tradeDirection": "{{tradeDirection}}",
                "executionPrice": "{{executionPrice}}",
                "executionQuantity": "{{executionQuantity}}",
                "executionMargin": "{{executionMargin}}"
            },
            "payout": "{{payout}}",
            "fee": "{{fee}}",
            "executedAt": "{{executedAt}}"
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
Extract the following trade history information:
- List of trades with full details
- Pagination information
`
    } as ResponseTemplate
};