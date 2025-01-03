// templates/permissions.ts
import { ResponseTemplate, CoinTemplate } from './templates/types';

export interface PermissionsModuleParams {
    enablePermissions: boolean;
    defaultSendEnabled: boolean;
}

export interface Namespace {
    denom: string;
    roles: string[];
    addresses: Array<{
        address: string;
        roles: string[];
    }>;
}

export interface AddressRoles {
    roles: string[];
}

export const permissionsTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "enablePermissions": {{enablePermissions}},
    "defaultSendEnabled": {{defaultSendEnabled}}
}
\`\`\`
`,
        description: `
Extract the following permissions parameters:
- Permissions enabled status
- Default send enabled status
`
    } as ResponseTemplate,

    addressesByRole: {
        template: `
\`\`\`json
{
    "addresses": [
        {
            "address": "{{address}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following addresses by role:
- List of addresses with specified role
`
    } as ResponseTemplate,

    addressRoles: {
        template: `
\`\`\`json
{
    "roles": [
        {
            "role": "{{role}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following address roles:
- List of roles assigned to address
`
    } as ResponseTemplate,

    allNamespaces: {
        template: `
\`\`\`json
{
    "namespaces": [
        {
            "denom": "{{denom}}",
            "roles": ["{{role}}"],
            "addresses": [
                {
                    "address": "{{address}}",
                    "roles": ["{{role}}"]
                }
            ]
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following namespaces information:
- List of all namespaces
- Roles and addresses in each namespace
`
    } as ResponseTemplate,

    namespaceByDenom: {
        template: `
\`\`\`json
{
    "denom": "{{denom}}",
    "roles": ["{{role}}"],
    "addresses": [
        {
            "address": "{{address}}",
            "roles": ["{{role}}"]
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following namespace information:
- Denomination details
- Available roles
- Addresses with permissions
`
    } as ResponseTemplate,

    vouchersForAddress: {
        template: `
\`\`\`json
{
    "vouchers": [
        {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following voucher information:
- List of vouchers owned by address
- Denomination and amount details
`
    } as ResponseTemplate
};