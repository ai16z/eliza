import { ResponseTemplate } from './templates/types';

export interface PublicKeyParams {
    type: string;
    value: string;
}

export interface AuthModuleParams {
    maxMemoCharacters: number;
    txSigLimit: number;
    txSizeCostPerByte: number;
    sigVerifyCostEd25519: number;
    sigVerifyCostSecp256k1: number;
    pubKeyParams: PublicKeyParams[];
}

export interface Account {
    address: string;
    pubKey?: {
        type: string;
        key: string;
    };
    accountNumber: string;
    sequence: string;
}

export const authTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "maxMemoCharacters": {{maxMemoCharacters}},
    "txSigLimit": {{txSigLimit}},
    "txSizeCostPerByte": {{txSizeCostPerByte}},
    "sigVerifyCostEd25519": {{sigVerifyCostEd25519}},
    "sigVerifyCostSecp256k1": {{sigVerifyCostSecp256k1}},
    "pubKeyParams": {{pubKeyParams}}
}
\`\`\`
`,
        description: `
Extract the following auth parameters:
- Maximum memo characters allowed
- Transaction signature limit
- Transaction size cost per byte
- Signature verification costs (Ed25519 and Secp256k1)
- Public key parameters
`
    } as ResponseTemplate,

    account: {
        template: `
\`\`\`json
{
    "address": "{{address}}",
    "pubKey": {
        "type": "{{pubKeyType}}",
        "key": "{{pubKeyValue}}"
    },
    "accountNumber": "{{accountNumber}}",
    "sequence": "{{sequence}}"
}
\`\`\`
`,
        description: `
Extract the following account details:
- Account address
- Public key information (type and value)
- Account number
- Sequence number
`
    } as ResponseTemplate,

    accounts: {
        template: `
\`\`\`json
{
    "accounts": [
        {
            "address": "{{address}}",
            "pubKey": {
                "type": "{{pubKeyType}}",
                "key": "{{pubKeyValue}}"
            },
            "accountNumber": "{{accountNumber}}",
            "sequence": "{{sequence}}"
        }
    ],
    "pagination": {
        "nextKey": "{{nextKey}}",
        "total": "{{total}}"
    }
}
\`\`\`
`,
        description: `
Extract the following accounts information:
- List of account details
- Pagination information
`
    } as ResponseTemplate
};