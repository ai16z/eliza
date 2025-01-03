import { CoinTemplate, PaginationTemplate } from '../templates/types';

export interface FeeDiscountTierInfo {
    makerDiscountRate: string;
    takerDiscountRate: string;
    stakedAmount: string;
    volume: string;
}

export interface ExchangeModuleParams {
    spotMarketInstantListingFee: CoinTemplate;
    derivativeMarketInstantListingFee: CoinTemplate;
    defaultSpotMakerFeeRate: string;
    defaultSpotTakerFeeRate: string;
    defaultDerivativeMakerFeeRate: string;
    defaultDerivativeTakerFeeRate: string;
    defaultInitialMarginRatio: string;
    defaultMaintenanceMarginRatio: string;
    defaultFundingInterval: number;
    fundingMultiple: number;
    relayerFeeShareRate: string;
    defaultHourlyFundingRateCap: string;
    defaultHourlyInterestRate: string;
    maxLeverageRatio: string;
    fundingRateFactor: string;
}

export interface MarketStatus {
    status: string;
    updatedAt: string;
}

export interface PriceLevel {
    price: string;
    quantity: string;
    timestamp: number;
}

export interface OrderbookWithSequence {
    sequence: number;
    buys: PriceLevel[];
    sells: PriceLevel[];
}
