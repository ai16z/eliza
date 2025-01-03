export const positionTemplates = {
    position: {
        template: `
\`\`\`json
{
    "marketId": "{{marketId}}",
    "subaccountId": "{{subaccountId}}",
    "direction": "{{direction}}",
    "quantity": "{{quantity}}",
    "entryPrice": "{{entryPrice}}",
    "margin": "{{margin}}",
    "liquidationPrice": "{{liquidationPrice}}",
    "markPrice": "{{markPrice}}",
    "aggregateReduceOnlyQuantity": "{{aggregateReduceOnlyQuantity}}",
    "updatedAt": "{{updatedAt}}"
}
\`\`\`
`,
        description: `
Extract the following position information:
- Market and subaccount identifiers
- Position details (direction, quantity, prices)
- Risk parameters (margin, liquidation price)
- Position status and timestamps
`
    } as ResponseTemplate,

    positionsList: {
        template: `
\`\`\`json
{
    "positions": [
        {
            "marketId": "{{marketId}}",
            "subaccountId": "{{subaccountId}}",
            "direction": "{{direction}}",
            "quantity": "{{quantity}}",
            "entryPrice": "{{entryPrice}}",
            "margin": "{{margin}}",
            "liquidationPrice": "{{liquidationPrice}}",
            "markPrice": "{{markPrice}}",
            "aggregateReduceOnlyQuantity": "{{aggregateReduceOnlyQuantity}}",
            "updatedAt": "{{updatedAt}}"
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
Extract the following positions list information:
- Array of positions with full details
- Pagination information
`
    } as ResponseTemplate
};