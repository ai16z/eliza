export const swapTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested token swap:
- Chain to execute on (must be exactly "ethereum", "base", or "sepolia", no other variations) - REQUIRED
- Input token (ETH or token address) - REQUIRED
- Output token (token address) - REQUIRED
- Amount to swap - REQUIRED
- Slippage tolerance (optional, in basis points, default 50 = 0.5%)

For common tokens, use these addresses:
- ETH: 0x0000000000000000000000000000000000000000
- USDC on Ethereum: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
- USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
- USDC on Sepolia: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

Important validation rules:
1. Chain MUST be exactly "ethereum", "base", or "sepolia" (lowercase)
2. Token addresses MUST be valid Ethereum addresses (0x...)
3. Amount MUST be a valid number as a string
4. Slippage MUST be a number between 1-500 (0.01% to 5%)

If any required field cannot be confidently determined, respond with null for that field.

Respond with a JSON markdown block containing only the extracted values:

\`\`\`json
{
    "chain": "ethereum" | "base" | "sepolia",
    "fromToken": string,
    "toToken": string,
    "amount": string,
    "slippage": number | null
}
\`\`\`

Example responses:

For "Swap 1 ETH for USDC on Ethereum":
\`\`\`json
{
    "chain": "ethereum",
    "fromToken": "0x0000000000000000000000000000000000000000",
    "toToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "amount": "1",
    "slippage": 50
}
\`\`\`

For "Swap 0.1 ETH for USDC on Sepolia":
\`\`\`json
{
    "chain": "sepolia",
    "fromToken": "0x0000000000000000000000000000000000000000",
    "toToken": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    "amount": "0.1",
    "slippage": 50
}
\`\`\`
`;