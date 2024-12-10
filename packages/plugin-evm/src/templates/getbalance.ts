export const getbalanceTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the balance check request:
- Chain to check balance on (must be exactly "ethereum", "base", or "sepolia", no other variations) - REQUIRED
- Token address (optional, if not provided will check ETH balance)

Common token addresses:
- USDC on Ethereum: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
- USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
- USDC on Sepolia: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

Respond with a JSON markdown block containing only the extracted values:

\`\`\`json
{
    "chain": "ethereum" | "base" | "sepolia",
    "tokenAddress": string | null
}
\`\`\`

Example responses:

For "Check my ETH balance on Sepolia":
\`\`\`json
{
    "chain": "sepolia",
    "tokenAddress": null
}
\`\`\`

For "What's my USDC balance on Ethereum?":
\`\`\`json
{
    "chain": "ethereum",
    "tokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
}
\`\`\`
`;