export const fundTemplate = `
Extract the following details to fund the wallet:
- **amount** (number): Amount to fund the wallet

Provide the values in the following JSON format:

\`\`\`json
{
    "amount": "<amount>"
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
`;

export const balanceTemplate = `
Extract the following details to check the wallet balance:

Provide the values in the following JSON format:

\`\`\`json
{
    "address": "address"
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
`;

export const walletTemplate = `
Extract the following details to check the wallet address/status/balance:

Provide the values in the following JSON format:

\`\`\`json
{
    "address": "address"
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
`;

export const withdrawTemplate = `
Extract the following details to withdraw from the wallet:
- **amount** (number): Amount to withdraw

Provide the values in the following JSON format:

\`\`\`json
{
    "amount": "<amount>"
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
`;

export const showPrivateKeyTemplate = `
Extract the following details to show the private key:
- **address** (string): Address to show the private key for

Provide the values in the following JSON format:

\`\`\`json
{
    "address": "<address>"
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
`;

export const transferTemplate = `
Extract the following details to transfer USDC:
- **amount** (number): Amount to transfer
- **recipient** (string): Recipient username or address

Provide the values in the following JSON format:

\`\`\`json
{
    "amount": "<amount>",
    "recipient": "<recipient>"
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
`;

export const swapTemplate = `
Extract the following details to swap tokens:
- **amount** (number): Amount to swap
- **fromToken** (string): Token to swap from (e.g., ETH)
- **toToken** (string): Token to swap to (e.g., USDC)

Provide the values in the following JSON format:

\`\`\`json
{
    "amount": "<amount>",
    "fromToken": "<fromToken>",
    "toToken": "<toToken>"
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
`;

export const readResourceTemplate = `
Extract the following details to read a resource:
- **id** (string): Unique identifier of the resource
- **fields** (array): Specific fields to retrieve (optional)

Provide the values in the following JSON format:

\`\`\`json
{
    "id": "<resource_id>",
    "fields": ["<field1>", "<field2>"]
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
`;

export const updateResourceTemplate = `
Extract the following details to update a resource:
- **id** (string): Unique identifier of the resource
- **updates** (object): Key-value pairs of fields to update

Provide the values in the following JSON format:

\`\`\`json
{
    "id": "<resource_id>",
    "updates": {
        "<field1>": "<new_value1>",
        "<field2>": "<new_value2>"
    }
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
`;
