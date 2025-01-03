// templates/ibc.ts
import { ResponseTemplate, PaginationTemplate } from './templates/types';

export interface DenomTrace {
    path: string;
    baseDenom: string;
}

export interface IBCTransfer {
    sender: string;
    receiver: string;
    sourcePort: string;
    sourceChannel: string;
    destPort: string;
    destChannel: string;
    amount: {
        denom: string;
        amount: string;
    };
    timeoutHeight: {
        revisionNumber: string;
        revisionHeight: string;
    };
    timeoutTimestamp: string;
}

export const ibcTemplates = {
    denomTrace: {
        template: `
\`\`\`json
{
    "path": "{{path}}",
    "baseDenom": "{{baseDenom}}"
}
\`\`\`
`,
        description: `
Extract the following denomination trace information:
- IBC path
- Base denomination
`
    } as ResponseTemplate,

    denomsTrace: {
        template: `
\`\`\`json
{
    "denomTraces": [
        {
            "path": "{{path}}",
            "baseDenom": "{{baseDenom}}"
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
Extract the following denominations trace list:
- Array of denomination traces
- Pagination information
`
    } as ResponseTemplate,

    transfer: {
        template: `
\`\`\`json
{
    "sourcePort": "{{sourcePort}}",
    "sourceChannel": "{{sourceChannel}}",
    "token": {
        "denom": "{{denom}}",
        "amount": "{{amount}}"
    },
    "sender": "{{sender}}",
    "receiver": "{{receiver}}",
    "timeoutHeight": {
        "revisionNumber": "{{revisionNumber}}",
        "revisionHeight": "{{revisionHeight}}"
    },
    "timeoutTimestamp": "{{timeoutTimestamp}}"
}
\`\`\`
`,
        description: `
Extract the following IBC transfer information:
- Source port and channel
- Token details
- Sender and receiver addresses
- Timeout configuration
`
    } as ResponseTemplate,

    channel: {
        template: `
\`\`\`json
{
    "state": "{{state}}",
    "ordering": "{{ordering}}",
    "counterparty": {
        "portId": "{{portId}}",
        "channelId": "{{channelId}}"
    },
    "connectionHops": ["{{connectionHop}}"],
    "version": "{{version}}"
}
\`\`\`
`,
        description: `
Extract the following channel information:
- Channel state
- Ordering type
- Counterparty details
- Connection hops
- Protocol version
`
    } as ResponseTemplate,

    channels: {
        template: `
\`\`\`json
{
    "channels": [
        {
            "state": "{{state}}",
            "ordering": "{{ordering}}",
            "counterparty": {
                "portId": "{{portId}}",
                "channelId": "{{channelId}}"
            },
            "connectionHops": ["{{connectionHop}}"],
            "version": "{{version}}"
        }
    ],
    "pagination": {
        "nextKey": "{{nextKey}}",
        "total": "{{total}}"
    },
    "height": {
        "revisionNumber": "{{revisionNumber}}",
        "revisionHeight": "{{revisionHeight}}"
    }
}
\`\`\`
`,
        description: `
Extract the following channels information:
- Array of channels with details
- Pagination information
- Block height information
`
    } as ResponseTemplate,

    packet: {
        template: `
\`\`\`json
{
    "sequence": "{{sequence}}",
    "sourcePort": "{{sourcePort}}",
    "sourceChannel": "{{sourceChannel}}",
    "destinationPort": "{{destinationPort}}",
    "destinationChannel": "{{destinationChannel}}",
    "data": "{{data}}",
    "timeoutHeight": {
        "revisionNumber": "{{revisionNumber}}",
        "revisionHeight": "{{revisionHeight}}"
    },
    "timeoutTimestamp": "{{timeoutTimestamp}}"
}
\`\`\`
`,
        description: `
Extract the following packet information:
- Sequence number
- Source and destination details
- Packet data
- Timeout configuration
`
    } as ResponseTemplate,

    packetCommitment: {
        template: `
\`\`\`json
{
    "commitment": "{{commitment}}",
    "proof": "{{proof}}",
    "proofHeight": {
        "revisionNumber": "{{revisionNumber}}",
        "revisionHeight": "{{revisionHeight}}"
    }
}
\`\`\`
`,
        description: `
Extract the following packet commitment information:
- Commitment hash
- Proof data
- Proof height details
`
    } as ResponseTemplate,

    packetAcknowledgement: {
        template: `
\`\`\`json
{
    "acknowledgement": "{{acknowledgement}}",
    "proof": "{{proof}}",
    "proofHeight": {
        "revisionNumber": "{{revisionNumber}}",
        "revisionHeight": "{{revisionHeight}}"
    }
}
\`\`\`
`,
        description: `
Extract the following packet acknowledgement information:
- Acknowledgement data
- Proof data
- Proof height details
`
    } as ResponseTemplate,

    clientState: {
        template: `
\`\`\`json
{
    "chainId": "{{chainId}}",
    "trustLevel": {
        "numerator": "{{numerator}}",
        "denominator": "{{denominator}}"
    },
    "trustingPeriod": "{{trustingPeriod}}",
    "unbondingPeriod": "{{unbondingPeriod}}",
    "maxClockDrift": "{{maxClockDrift}}",
    "frozenHeight": {
        "revisionNumber": "{{revisionNumber}}",
        "revisionHeight": "{{revisionHeight}}"
    },
    "latestHeight": {
        "revisionNumber": "{{revisionNumber}}",
        "revisionHeight": "{{revisionHeight}}"
    },
    "proofSpecs": [],
    "upgradePath": ["{{upgradePath}}"],
    "allowUpdateAfterExpiry": {{allowUpdateAfterExpiry}},
    "allowUpdateAfterMisbehaviour": {{allowUpdateAfterMisbehaviour}}
}
\`\`\`
`,
        description: `
Extract the following client state information:
- Chain identification
- Trust parameters
- Timing configurations
- Height information
- Update permissions
`
    } as ResponseTemplate
};