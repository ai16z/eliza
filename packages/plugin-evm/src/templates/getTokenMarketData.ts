export const getTokenMarketDataTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the token market data request:
- Chain to check on (must be exactly "ethereum", "base", or "sepolia") - REQUIRED
- Token address - REQUIRED
- Timeframe (optional, must be "24h", "7d", or "30d", defaults to "24h")

Respond with a JSON markdown block containing only the extracted values:

\`\`\`json
{
    "chain": "ethereum" | "base" | "sepolia",
    "tokenAddress": string,
    "timeframe": "24h" | "7d" | "30d"
}
\`\`\`
`;