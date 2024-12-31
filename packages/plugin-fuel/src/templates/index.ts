export const transferTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- Amount to transfer: Must be a string representing the amount in ETH (only number without coin symbol, e.g., "0.1")
- Recipient address: Must be a valid Fuel wallet address starting with "0x"

Respond with a JSON markdown block containing only the extracted values. All fields except 'token' are required:

\`\`\`json
{
    "amount": string,
    "toAddress": string,
}
\`\`\`
`;
