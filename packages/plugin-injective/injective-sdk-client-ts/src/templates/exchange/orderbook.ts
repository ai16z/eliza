export const orderbookTemplates = {
    orderbook: {
        template: `
\`\`\`json
{
    "sequence": {{sequence}},
    "buys": [
        {
            "price": "{{price}}",
            "quantity": "{{quantity}}",
            "timestamp": {{timestamp}}
        }
    ],
    "sells": [
        {
            "price": "{{price}}",
            "quantity": "{{quantity}}",
            "timestamp": {{timestamp}}
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following orderbook information:
- Sequence number
- Buy orders with price levels
- Sell orders with price levels
- Timestamps for each level
`
    } as ResponseTemplate
};