export const transferTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- Chain to execute on (ethereum or base)
- Amount to transfer
- Recipient address
- Token symbol or address (if not native token)

Respond with a JSON markdown block containing only the extracted values:

\`\`\`json
{
    "fromChain": "ethereum" | "base" | "curtis" | "apechain" | null,
    "amount": string | null,
    "toAddress": string | null,
    "token": string | null
}
\`\`\`
`;

export const checkTokenBalanceTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested token balance check:
- Token address
- Wallet to check (if specified)
- Chain to check (if specified)
- Check agent token balance (if specified)

Respond with a JSON markdown block containing only the extracted values:

\`\`\`json
{
    "tokenAddress": string | null,
    "walletToCheck": string | null,
    "chainToCheck": "ethereum" | "base" | "curtis" | "apechain" | null,
    "checkAgentTokenBalance": boolean | null
}
\`\`\`
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
    "fromChain": "ethereum" | "base" | "curtis" | "apechain" | null,
    "toChain": "ethereum" | "base" | "curtis" | "apechain" | null,
    "amount": string | null,
    "toAddress": string | null
}
\`\`\`
`;

export const swapTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested token swap:
- Input token symbol or address (the token being sold)
- Output token symbol or address (the token being bought)
- Amount to swap
- Chain to execute on (ethereum or base)

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "inputToken": string | null,
    "outputToken": string | null,
    "amount": string | null,
    "chain": "ethereum" | "base" | "curtis" | "apechain" | null,
    "slippage": number | null
}
\`\`\`
`;
