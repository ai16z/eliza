
export const createCollectionTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- chainName to execute on: Must be one of ["ethereum", "base", ...] (like in viem/chains)

Respond with a JSON markdown block containing only the extracted values. All fields are required:

\`\`\`json
{
    "chainName": SUPPORTED_CHAINS,
}
\`\`\`

Note: Ensure to use the user’s latest instruction to extract data; if it is not within the defined options, use null.

`;

export const collectionImageTemplate = `
Generate a logo with the text "{{collectionName}}", using orange as the main color, with a sci-fi and mysterious background theme
`;
export const mintNFTTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
Respond with a JSON markdown block containing only the extracted values. All fields are required:
\`\`\`json
{
    "collectionAddress": "D8j4ubQ3MKwmAqiJw83qT7KQNKjhsuoC7zJJdJa5BkvS",
    "chainName": SUPPORTED_CHAINS,
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested mint nft:
- collection contract address


Note: Ensure to use the user’s latest instruction to extract data; if it is not within the defined options, use null.`;
