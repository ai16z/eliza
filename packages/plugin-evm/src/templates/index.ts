export * from "./getbalance";
export * from "./swap";

export const transferTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- Chain to execute on (ethereum, base, or sepolia)
- Amount to transfer
- Recipient address

Respond with a JSON markdown block containing only the extracted values in this exact format:

\`\`\`json
{
    "fromChain": "ethereum" | "base" | "sepolia",
    "amount": "1.0",
    "toAddress": "0x...",
    "data": "0x" | null
}
\`\`\`

Notes:
- fromChain must be exactly "ethereum", "base", or "sepolia"
- amount must be a string number like "1.0", "0.5", etc.
- toAddress must be a full ethereum address starting with 0x
- data is optional and defaults to null
`;

export const bridgeTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested token bridge:
- Token symbol or address to bridge
- Source chain (ethereum or base)
- Destination chain (ethereum or base)
- Amount to bridge
- Destination address (if specified)

Respond with a JSON markdown block containing only the extracted values:

\`\`\`json
{
    "token": string | null,
    "fromChain": "ethereum" | "base" | null,
    "toChain": "ethereum" | "base" | null,
    "amount": string | null,
    "toAddress": string | null
}
\`\`\`
`;