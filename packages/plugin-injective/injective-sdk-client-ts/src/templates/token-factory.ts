// templates/token-factory.ts
import { ResponseTemplate, CoinTemplate } from './templates/types';

export interface TokenFactoryModuleParams {
    denomCreationFee: CoinTemplate[];
}

export interface AuthorityMetadata {
    admin: string;
}

export interface TokenFactoryModuleState {
    params: TokenFactoryModuleParams;
    factoryDenoms: Array<{
        denom: string;
        authorityMetadata: AuthorityMetadata;
    }>;
}

export const tokenFactoryTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "denomCreationFee": [
        {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following token factory parameters:
- Denomination creation fee details
`
    } as ResponseTemplate,

    moduleState: {
        template: `
\`\`\`json
{
    "params": {
        "denomCreationFee": [
            {
                "denom": "{{denom}}",
                "amount": "{{amount}}"
            }
        ]
    },
    "factoryDenoms": [
        {
            "denom": "{{denom}}",
            "authorityMetadata": {
                "admin": "{{admin}}"
            }
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following module state information:
- Module parameters
- List of factory denominations
- Authority metadata
`
    } as ResponseTemplate,

    denomsFromCreator: {
        template: `
\`\`\`json
{
    "denoms": ["{{denom}}"]
}
\`\`\`
`,
        description: `
Extract the following creator denoms:
- List of denominations created by address
`
    } as ResponseTemplate,

    denomAuthorityMetadata: {
        template: `
\`\`\`json
{
    "admin": "{{admin}}"
}
\`\`\`
`,
        description: `
Extract the following authority metadata:
- Admin address for denomination
`
    } as ResponseTemplate
};