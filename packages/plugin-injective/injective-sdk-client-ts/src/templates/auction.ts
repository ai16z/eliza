import { ResponseTemplate, CoinTemplate } from './templates/types';

export interface AuctionModuleParams {
    auctionPeriod: string;
    minNextBidIncrementRate: string;
    defaultBidAmount: string;
}

export interface AuctionBid {
    bidder: string;
    amount: CoinTemplate;
}

export interface AuctionModuleState {
    params: AuctionModuleParams;
    currentBasket: {
        amountList: CoinTemplate[];
    };
    currentRound: number;
    highestBid: AuctionBid;
}

export const auctionTemplates = {
    moduleParams: {
        template: `
\`\`\`json
{
    "auctionPeriod": "{{auctionPeriod}}",
    "minNextBidIncrementRate": "{{minNextBidIncrementRate}}",
    "defaultBidAmount": "{{defaultBidAmount}}"
}
\`\`\`
`,
        description: `
Extract the following auction parameters:
- Auction period duration
- Minimum next bid increment rate
- Default bid amount
`
    } as ResponseTemplate,

    moduleState: {
        template: `
\`\`\`json
{
    "params": {
        "auctionPeriod": "{{auctionPeriod}}",
        "minNextBidIncrementRate": "{{minNextBidIncrementRate}}"
    },
    "currentBasket": {
        "amountList": []
    },
    "currentRound": {{currentRound}},
    "highestBid": {
        "bidder": "{{bidder}}",
        "amount": {
            "denom": "{{denom}}",
            "amount": "{{amount}}"
        }
    }
}
\`\`\`
`,
        description: `
Extract the following auction state information:
- Module parameters
- Current basket contents
- Current auction round
- Highest bid details
`
    } as ResponseTemplate
};