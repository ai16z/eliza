// templates/mint.ts
import { ResponseTemplate } from './templates/types';

export interface MinModuleParams {
    mintDenom: string;
    inflationRateChange: string;
    inflationMax: string;
    inflationMin: string;
    goalBonded: string;
    blocksPerYear: string;
}

export const mintTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "mintDenom": "{{mintDenom}}",
    "inflationRateChange": "{{inflationRateChange}}",
    "inflationMax": "{{inflationMax}}",
    "inflationMin": "{{inflationMin}}",
    "goalBonded": "{{goalBonded}}",
    "blocksPerYear": "{{blocksPerYear}}"
}
\`\`\`
`,
        description: `
Extract the following mint parameters:
- Mint denomination
- Inflation rate parameters (change, max, min)
- Goal bonded ratio
- Blocks per year
`
    } as ResponseTemplate,

    inflation: {
        template: `
\`\`\`json
{
    "inflation": "{{inflation}}"
}
\`\`\`
`,
        description: `
Extract the following inflation information:
- Current inflation rate
`
    } as ResponseTemplate,

    annualProvisions: {
        template: `
\`\`\`json
{
    "annualProvisions": "{{annualProvisions}}"
}
\`\`\`
`,
        description: `
Extract the following annual provisions information:
- Current annual provision amount
`
    } as ResponseTemplate
};