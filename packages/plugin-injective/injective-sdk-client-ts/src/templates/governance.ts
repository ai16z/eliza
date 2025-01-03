// templates/governance.ts
import { ResponseTemplate, CoinTemplate } from './templates/types';

export interface GovModuleParams {
    minDeposit: CoinTemplate[];
    maxDepositPeriod: string;
    votingPeriod: string;
    quorum: string;
    threshold: string;
    vetoThreshold: string;
    minInitialDepositRatio: string;
}

export interface TallyResult {
    yes: string;
    abstain: string;
    no: string;
    noWithVeto: string;
}

export interface Proposal {
    proposalId: string;
    content: {
        type: string;
        value: any;
    };
    status: string;
    finalTallyResult: TallyResult;
    submitTime: string;
    depositEndTime: string;
    totalDeposit: CoinTemplate[];
    votingStartTime: string;
    votingEndTime: string;
}

export const governanceTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "minDeposit": [
        {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
        }
    ],
    "maxDepositPeriod": "{{maxDepositPeriod}}",
    "votingPeriod": "{{votingPeriod}}",
    "quorum": "{{quorum}}",
    "threshold": "{{threshold}}",
    "vetoThreshold": "{{vetoThreshold}}",
    "minInitialDepositRatio": "{{minInitialDepositRatio}}"
}
\`\`\`
`,
        description: `
Extract the following governance parameters:
- Minimum deposit requirements
- Time periods (deposit, voting)
- Voting thresholds (quorum, pass threshold, veto)
- Initial deposit ratio requirement
`
    } as ResponseTemplate,

    proposal: {
        template: `
\`\`\`json
{
    "proposalId": "{{proposalId}}",
    "content": {
        "type": "{{contentType}}",
        "value": {{contentValue}}
    },
    "status": "{{status}}",
    "finalTallyResult": {
        "yes": "{{yesVotes}}",
        "abstain": "{{abstainVotes}}",
        "no": "{{noVotes}}",
        "noWithVeto": "{{noWithVetoVotes}}"
    },
    "submitTime": "{{submitTime}}",
    "depositEndTime": "{{depositEndTime}}",
    "totalDeposit": [
        {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
        }
    ],
    "votingStartTime": "{{votingStartTime}}",
    "votingEndTime": "{{votingEndTime}}"
}
\`\`\`
`,
        description: `
Extract the following proposal information:
- Proposal identification and content
- Current status
- Voting results
- Timeline information
- Deposit details
`
    } as ResponseTemplate,

    proposalsList: {
        template: `
\`\`\`json
{
    "proposals": [
        {
            "proposalId": "{{proposalId}}",
            "status": "{{status}}",
            "finalTallyResult": {
                "yes": "{{yesVotes}}",
                "abstain": "{{abstainVotes}}",
                "no": "{{noVotes}}",
                "noWithVeto": "{{noWithVetoVotes}}"
            },
            "submitTime": "{{submitTime}}",
            "depositEndTime": "{{depositEndTime}}",
            "totalDeposit": [
                {
                    "denom": "{{denom}}",
                    "amount": "{{amount}}"
                }
            ],
            "votingStartTime": "{{votingStartTime}}",
            "votingEndTime": "{{votingEndTime}}"
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
Extract the following proposals list information:
- Array of proposals with summary information
- Pagination details
`
    } as ResponseTemplate,

    vote: {
        template: `
\`\`\`json
{
    "proposalId": "{{proposalId}}",
    "voter": "{{voter}}",
    "option": "{{option}}",
    "metadata": "{{metadata}}"
}
\`\`\`
`,
        description: `
Extract the following vote information:
- Proposal identification
- Voter address
- Vote option
- Optional metadata
`
    } as ResponseTemplate,

    deposit: {
        template: `
\`\`\`json
{
    "proposalId": "{{proposalId}}",
    "depositor": "{{depositor}}",
    "amount": [
        {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
        }
    ]
}
\`\`\`
`,
        description: `
Extract the following deposit information:
- Proposal identification
- Depositor address
- Deposit amount details
`
    } as ResponseTemplate,

    tally: {
        template: `
\`\`\`json
{
    "yes": "{{yesVotes}}",
    "abstain": "{{abstainVotes}}",
    "no": "{{noVotes}}",
    "noWithVeto": "{{noWithVetoVotes}}"
}
\`\`\`
`,
        description: `
Extract the following tally information:
- Vote counts by option (yes, no, abstain, veto)
`
    } as ResponseTemplate
};