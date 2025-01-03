import { InjectiveGrpcBase } from "../grpc/grpc-base.js";
import {
    MitoVault,
    MitoPagination,
    MitoPriceSnapshot,
    MitoSubscription,
    MitoHolders,
    MitoPortfolio,
    MitoLeaderboard,
    MitoTransfer,
    MitoLeaderboardEpoch,
    MitoStakingPool,
    MitoMission,
    MitoMissionLeaderboard,
    MitoIDO,
    MitoIDOSubscriber,
    MitoTokenInfo,
    MitoIDOSubscription,
    MitoIDOSubscriptionActivity,
    MitoWhitelistAccount,
    MitoClaimReference,
} from "@injectivelabs/sdk-ts";
import { Coin } from "@injectivelabs/ts-types";

export function getVault(
    this: InjectiveGrpcBase,
    params: {
        contractAddress?: string;
        slug?: string;
    }
): Promise<MitoVault> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchVault,
        params,
    });
}

export function getVaults(
    this: InjectiveGrpcBase,
    params?: {
        limit?: number;
        codeId?: string;
        pageIndex?: number;
    }
): Promise<{
    vaults: MitoVault[];
    pagination?: MitoPagination;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchVaults,
        params: params || {},
    });
}

export function getLpTokenPriceChart(
    this: InjectiveGrpcBase,
    params: {
        to?: string;
        from?: string;
        vaultAddress: string;
    }
): Promise<MitoPriceSnapshot[]> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchLpTokenPriceChart,
        params,
    });
}

export function getTVLChart(
    this: InjectiveGrpcBase,
    params: {
        to?: string;
        from?: string;
        vaultAddress: string;
    }
): Promise<MitoPriceSnapshot[]> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchTVLChartRequest,
        params,
    });
}

export function getVaultsByHolderAddress(
    this: InjectiveGrpcBase,
    params: {
        skip?: number;
        limit?: number;
        holderAddress: string;
        vaultAddress?: string;
    }
): Promise<{
    subscriptions: MitoSubscription[];
    pagination: MitoPagination | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchVaultsByHolderAddress,
        params,
    });
}

export function getLPHolders(
    this: InjectiveGrpcBase,
    params: {
        skip?: number;
        limit?: number;
        vaultAddress: string;
        stakingContractAddress: string;
    }
): Promise<{
    holders: MitoHolders[];
    pagination: MitoPagination | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchLPHolders,
        params,
    });
}

export function getHolderPortfolio(
    this: InjectiveGrpcBase,
    params: {
        holderAddress: string;
        stakingContractAddress: string;
    }
): Promise<MitoPortfolio> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchHolderPortfolio,
        params,
    });
}

export function getLeaderboard(
    this: InjectiveGrpcBase,
    epochId?: number
): Promise<MitoLeaderboard> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchLeaderboard,
        params: epochId,
    });
}

export function getTransferHistory(
    this: InjectiveGrpcBase,
    params?: {
        vault?: string;
        account?: string;
        limit?: number;
        toNumber?: number;
        fromNumber?: number;
    }
): Promise<{
    transfers: MitoTransfer[];
    pagination: MitoPagination | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchTransferHistory,
        params: params || {},
    });
}

export function getLeaderboardEpochs(
    this: InjectiveGrpcBase,
    params?: {
        limit?: number;
        toEpochId?: number;
        fromEpochId?: number;
    }
): Promise<{
    epochs: MitoLeaderboardEpoch[];
    pagination: MitoPagination | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchLeaderboardEpochs,
        params: params || {},
    });
}

export function getStakingPools(
    this: InjectiveGrpcBase,
    params: {
        staker?: string;
        stakingContractAddress: string;
    }
): Promise<{
    pools: MitoStakingPool[];
    pagination: MitoPagination | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchStakingPools,
        params,
    });
}

export function getStakingHistory(
    this: InjectiveGrpcBase,
    params?: {
        staker?: string;
        limit?: number;
        toNumber?: number;
        fromNumber?: number;
    }
): Promise<{
    activities: {
        action: string;
        txHash: string;
        staker: string;
        vaultAddress: string;
        numberByAccount: number;
        timestamp: number;
        rewardedTokens: Coin[];
        stakeAmount: Coin | undefined;
    }[];
    pagination: MitoPagination | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchStakingHistory,
        params: params || {},
    });
}

export function getStakingRewardsByAccount(
    this: InjectiveGrpcBase,
    params: {
        staker: string;
        stakingContractAddress: string;
    }
): Promise<{
    rewards: {
        apr: number;
        vaultName: string;
        vaultAddress: string;
        lockTimestamp: number;
        claimableRewards: Coin[];
        stakedAmount: Coin | undefined;
        lockedAmount: Coin | undefined;
    }[];
    pagination: MitoPagination | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchStakingRewardsByAccount,
        params,
    });
}

export function getMissions(
    this: InjectiveGrpcBase,
    params: {
        accountAddress: string;
    }
): Promise<MitoMission[]> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchMissions,
        params,
    });
}

export function getMissionLeaderboard(
    this: InjectiveGrpcBase,
    userAddress?: string
): Promise<MitoMissionLeaderboard> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchMissionLeaderboard,
        params: userAddress,
    });
}

export function getIDO(
    this: InjectiveGrpcBase,
    params: {
        contractAddress: string;
        accountAddress?: string;
    }
): Promise<{
    ido: MitoIDO | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchIDO,
        params,
    });
}

export function getIDOs(
    this: InjectiveGrpcBase,
    params?: {
        status?: string;
        limit?: number;
        toNumber?: number;
        accountAddress?: string;
        ownerAddress?: string;
    }
): Promise<{
    idos: MitoIDO[];
    pagination: MitoPagination | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchIDOs,
        params: params || {},
    });
}

export function getIDOSubscribers(
    this: InjectiveGrpcBase,
    params: {
        skip?: number;
        limit?: number;
        sortBy?: string;
        contractAddress: string;
    }
): Promise<{
    marketId: string;
    quoteDenom: string;
    subscribers: MitoIDOSubscriber[];
    pagination: MitoPagination | undefined;
    tokenInfo: MitoTokenInfo | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchIDOSubscribers,
        params,
    });
}

export function getIDOSubscription(
    this: InjectiveGrpcBase,
    params: {
        contractAddress: string;
        accountAddress: string;
    }
): Promise<{
    subscription: MitoIDOSubscription | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchIDOSubscription,
        params,
    });
}

export function getIDOActivities(
    this: InjectiveGrpcBase,
    params?: {
        contractAddress?: string;
        accountAddress?: string;
        limit?: number;
        toNumber?: string;
    }
): Promise<{
    activities: MitoIDOSubscriptionActivity[];
    pagination: MitoPagination | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchIDOActivities,
        params: params || {},
    });
}

export function getIDOWhitelist(
    this: InjectiveGrpcBase,
    params: {
        skip?: number;
        limit?: number;
        idoAddress: string;
    }
): Promise<{
    idoAddress: string | undefined;
    accounts: MitoWhitelistAccount[];
    pagination: MitoPagination | undefined;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchIDOWhitelist,
        params,
    });
}

export function getClaimReferences(
    this: InjectiveGrpcBase,
    params: {
        skip?: number;
        limit?: number;
        idoAddress: string;
        accountAddress: string;
    }
): Promise<{
    claimReferences: MitoClaimReference[];
    pagination?: MitoPagination;
}> {
    return this.request({
        method: this.indexerGrpcMitoApi.fetchClaimReferences,
        params,
    });
}
