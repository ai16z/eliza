export const transferTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- Field "token": Cadence Resource Identifier or ERC20 contract address (if not native token). this field should be null if the token is native token: $FLOW or FLOW. Examples for this field:
    1. For Cadence resource identifier, the field should be "A.1654653399040a61.ContractName"
    2. For ERC20 contract address, the field should be "0xe6ffc15a5bde7dd33c127670ba2b9fcb82db971a"
- Field "amount": Amount to transfer, it should be a number or a string. Examples for this field:
    1. "1000"
    2. 1000
- Field "to": Recipient wallet address, can be EVM address or Cadence address. Examples for this field:
    1. Cadence address: "0x1654653399040a61"
    2. EVM address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
- Field "matched": Boolean value indicating if field "token" matches the field "to" or not. Here is the rules:
    1. if field "token" is "null" or Cadence resource identifier, field "to" can be EVM address or Cadence address, so the value of "matched" should be true.
    2. if field "token" is ERC20 contract address, field "to" should be EVM address, so the value of "matched" should be true, otherwise false.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "token": string | null
    "amount": number | string | null,
    "to": string | null,
    "matched": boolean
}
\`\`\`
`;
