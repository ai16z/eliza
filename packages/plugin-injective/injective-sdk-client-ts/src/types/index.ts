import {
    PaginationOption,
    TradeDirection,
    TradeExecutionType,
    TradeExecutionSide,
    MarketType,
    GridStrategyType,
} from "@injectivelabs/sdk-ts";
import { OrderSide, OrderState } from "@injectivelabs/ts-types";
import { CosmosGovV1Gov } from "@injectivelabs/core-proto-ts";

// Base parameter interfaces
export interface PaginationParams {
    pagination?: PaginationOption;
}

export interface TimeRangeParams {
    startTime?: number;
    endTime?: number;
}

export interface AddressParams {
    address: string;
}

export interface MarketIdParam {
    marketId: string;
}

export interface SubaccountIdParam {
    subaccountId: string;
}

export interface DenomParam {
    denom: string;
}

// Auth Module Params
export interface AuthAccountParams extends AddressParams {
    accountAddress: string;
}

// Bank Module Params
export interface BankBalanceParams {
    accountAddress: string;
    denom: string;
}

export interface DenomMetadataParams extends DenomParam {}

export interface DenomOwnerParams extends DenomParam {}

// Distribution Module Params
export interface DelegatorValidatorParams {
    delegatorAddress: string;
    validatorAddress: string;
}

// Exchange Module Params
export interface MarketParams extends PaginationParams {
    baseDenom?: string;
    quoteDenom?: string;
    marketStatus?: string;
    marketStatuses?: string[];
}

export interface OrderParams extends PaginationParams {
    marketId?: string;
    marketIds?: string[];
    subaccountId?: string;
    orderSide?: OrderSide;
    isConditional?: boolean;
}

export interface OrderHistoryParams extends PaginationParams {
    subaccountId?: string;
    marketId?: string;
    marketIds?: string[];
    orderTypes?: OrderSide[];
    executionTypes?: TradeExecutionType[];
    direction?: TradeDirection;
    isConditional?: boolean;
    state?: OrderState;
}

export interface PositionParams extends PaginationParams {
    marketId?: string;
    marketIds?: string[];
    subaccountId?: string;
    direction?: TradeDirection;
    address?: string;
}

export interface TradeParams extends TimeRangeParams, PaginationParams {
    tradeId?: string;
    marketId?: string;
    marketIds?: string[];
    subaccountId?: string;
    accountAddress?: string;
    direction?: TradeDirection;
    executionSide?: TradeExecutionSide;
    executionTypes?: TradeExecutionType[];
}

export interface FundingParams extends PaginationParams {
    marketId?: string;
    marketIds?: string[];
    subaccountId?: string;
}

export interface SubaccountOrderParams extends PaginationParams {
    marketId?: string;
    subaccountId?: string;
}

export interface SubaccountTradeParams extends SubaccountOrderParams {
    direction?: TradeDirection;
    executionType?: TradeExecutionType;
}

export interface SubaccountHistoryParams extends SubaccountIdParam {
    denom?: string;
    transferTypes?: string[];
    pagination?: PaginationOption;
}

export interface SubaccountOrderSummaryParams extends SubaccountIdParam {
    marketId?: string;
    orderDirection?: string;
}

export interface OrderStateParams {
    spotOrderHashes?: string[];
    derivativeOrderHashes?: string[];
}

// Governance Module Params
export interface ProposalParams extends PaginationParams {
    status: CosmosGovV1Gov.ProposalStatus;
}

export interface ProposalQueryParams {
    proposalId: number;
}

export interface ProposalActionParams
    extends ProposalQueryParams,
        PaginationParams {}

// Insurance Fund Module Params
export interface InsuranceFundParams {
    marketId: string;
    address: string;
}

// Mito Module Params
export interface VaultParams {
    contractAddress?: string;
    slug?: string;
}

export interface VaultsParams extends PaginationParams {
    limit?: number;
    codeId?: string;
    pageIndex?: number;
}

export interface ChartParams extends TimeRangeParams {
    vaultAddress: string;
}

export interface VaultHolderParams extends PaginationParams {
    skip?: number;
    limit?: number;
    holderAddress: string;
    vaultAddress?: string;
}

export interface LPHoldersParams extends PaginationParams {
    skip?: number;
    limit?: number;
    vaultAddress: string;
    stakingContractAddress: string;
}

export interface HolderPortfolioParams {
    holderAddress: string;
    stakingContractAddress: string;
}

export interface TransferHistoryParams extends PaginationParams {
    vault?: string;
    account?: string;
    limit?: number;
    toNumber?: number;
    fromNumber?: number;
}

export interface LeaderboardEpochParams extends PaginationParams {
    limit?: number;
    toEpochId?: number;
    fromEpochId?: number;
}

export interface StakingPoolParams {
    staker?: string;
    stakingContractAddress: string;
}

export interface StakingHistoryParams extends PaginationParams {
    staker?: string;
    limit?: number;
    toNumber?: number;
    fromNumber?: number;
}

export interface StakingRewardsParams {
    staker: string;
    stakingContractAddress: string;
}

export interface MissionParams extends AddressParams {
    accountAddress: string;
}

export interface IDOParams {
    contractAddress: string;
    accountAddress?: string;
}

export interface IDOListParams extends PaginationParams {
    status?: string;
    limit?: number;
    toNumber?: number;
    accountAddress?: string;
    ownerAddress?: string;
}

export interface IDOSubscribersParams extends PaginationParams {
    skip?: number;
    limit?: number;
    sortBy?: string;
    contractAddress: string;
}

export interface IDOSubscriptionParams {
    contractAddress: string;
    accountAddress: string;
}

export interface IDOActivityParams extends PaginationParams {
    contractAddress?: string;
    accountAddress?: string;
    limit?: number;
    toNumber?: string;
}

export interface IDOWhitelistParams extends PaginationParams {
    skip?: number;
    limit?: number;
    idoAddress: string;
}

export interface ClaimReferenceParams extends PaginationParams {
    skip?: number;
    limit?: number;
    idoAddress: string;
    accountAddress: string;
}

// Permissions Module Params
export interface RoleParams {
    denom: string;
    role: string;
}

export interface AddressRoleParams {
    address: string;
    denom: string;
}

export interface NamespaceParams {
    denom: string;
    includeRoles: boolean;
}

export interface VoucherParams extends AddressParams {}

// Staking Module Params
export interface ValidatorParams extends PaginationParams {
    validatorAddress: string;
}

export interface DelegationParams {
    injectiveAddress: string;
    validatorAddress: string;
}

export interface DelegationsParams extends PaginationParams {
    injectiveAddress: string;
}

// Token Factory Module Params
export interface TokenFactoryParams {
    creator: string;
    subDenom: string;
}

// Wasm Module Params
export interface ContractBalanceParams extends PaginationParams {
    contractAddress: string;
}

export interface ContractStateParams extends PaginationParams {
    contractAddress: string;
}

export interface SmartContractParams {
    contractAddress: string;
    query?: string | Record<string, any>;
}

export interface RawContractParams {
    contractAddress: string;
    query?: string;
}

export interface ContractCodeParams {
    codeId: number;
    pagination?: PaginationOption;
}

// Explorer Module Params
export interface AccountTxParams extends TimeRangeParams {
    address: string;
    limit?: number;
    type?: string;
    before?: number;
    after?: number;
}

export interface BlocksParams extends TimeRangeParams {
    before?: number;
    after?: number;
    limit?: number;
}

export interface BlockParams {
    id: string;
}

export interface TxsParams extends TimeRangeParams {
    before?: number;
    after?: number;
    limit?: number;
    skip?: number;
    type?: string;
    chainModule?: string;
}

export interface IBCTransferParams extends PaginationParams {
    sender?: string;
    receiver?: string;
    srcChannel?: string;
    srcPort?: string;
    destChannel?: string;
    destPort?: string;
    limit?: number;
    skip?: number;
}

// Grid Strategy Params
export interface GridStrategyParams {
    accountAddress?: string;
    subaccountId?: string;
    state?: string;
    marketId?: string;
    limit?: number;
    skip?: number;
    marketType?: MarketType;
    strategyType?: GridStrategyType[];
}

// Leaderboard Params
export interface LeaderboardParams {
    startDate: string;
    endDate: string;
    limit?: number;
    account?: string;
}

export interface LeaderboardFixedParams {
    resolution: string;
    limit?: number;
    account?: string;
}
