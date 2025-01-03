// templates/wasmx.ts
import { ResponseTemplate } from './templates/types';

export interface WasmxModuleParams {
    isExecutionEnabled: boolean;
    maxBeginBlockTotalGas: number;
    maxContractGasLimit: number;
    minGasPrice: string;
}

export interface WasmxModuleState {
    params: WasmxModuleParams;
    contractRegistrations: Array<{
        gasLimit: number;
        contractAddress: string;
        gasPrice: string;
        isPaused: boolean;
        isExecutionEnabled: boolean;
    }>;
}

export const wasmxTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "isExecutionEnabled": {{isExecutionEnabled}},
    "maxBeginBlockTotalGas": {{maxBeginBlockTotalGas}},
    "maxContractGasLimit": {{maxContractGasLimit}},
    "minGasPrice": "{{minGasPrice}}"
}
\`\`\`
`,
        description: `
Extract the following WasmX parameters:
- Execution enabled status
- Gas limits (total and per contract)
- Minimum gas price
`
    } as ResponseTemplate,

    moduleState: {
        template: `
\`\`\`json
{
    "params": {
        "isExecutionEnabled": {{isExecutionEnabled}},
        "maxBeginBlockTotalGas": {{maxBeginBlockTotalGas}},
        "maxContractGasLimit": {{maxContractGasLimit}},
        "minGasPrice": "{{minGasPrice}}"
    },
    "contractRegistrations": [
        {
            "gasLimit": {{gasLimit}},
            "contractAddress": "{{contractAddress}}",
            "gasPrice": "{{gasPrice}}",
            "isPaused": {{isPaused}},
            "isExecutionEnabled": {{isExecutionEnabled}}
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following module state:
- Module parameters
- List of contract registrations
- Contract execution settings
`
    } as ResponseTemplate,
    
    contractRegistration: {
        template: `
\`\`\`json
{
    "gasLimit": {{gasLimit}},
    "contractAddress": "{{contractAddress}}",
    "gasPrice": "{{gasPrice}}",
    "isPaused": {{isPaused}},
    "isExecutionEnabled": {{isExecutionEnabled}}
}
\`\`\`
`,
        description: `
Extract the following contract registration:
- Gas configuration
- Contract address
- Execution status
`
    } as ResponseTemplate
};