export const xChainSwapTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

Extract the following information about the requested cross chain swap:
- Token symbol to swap from
- Token symbol to swap into (if defined, otherwise the same as the token symbol to swap from)
- Source chain
- Destination chain (if defined, otherwise the same as the source chain)
- Amount to swap, denominated in the token to be sent
- Destination address (if specified)

If the destination address is not specified, the EVM address of the runtime should be used.
If the token to swap into is not specified, the token to swap from should be used.
If the destination chain is not specified, the source chain should be used.

Respond with a JSON markdown block containing only the extracted values:

\`\`\`json
{
    "fromToken": string | null,
    "toToken": string | null,
    "fromChain": string | null,
    "toChain": string | null,
    "amount": string | null,
    "toAddress": string | null
}
\`\`\`
`;
