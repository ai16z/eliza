import { InjectiveGrpcBase } from "../grpc/grpc-base";
import { InjectiveExplorerRpc } from "@injectivelabs/indexer-proto-ts";
import {
    Transaction,
    ExplorerValidator,
    ValidatorUptime,
    PeggyDepositTx,
    PeggyWithdrawalTx,
    IBCTransferTx,
    ExplorerStats,
    ExchangePagination,
} from "@injectivelabs/sdk-ts";
export function getTxByHash(
    this: InjectiveGrpcBase,
    hash: string
): Promise<Transaction> {
    return this.request({
        method: (params: string) =>
            this.indexerGrpcExplorerApi.fetchTxByHash(params),
        params: hash,
    });
}

export function getAccountTx(
    this: InjectiveGrpcBase,
    params: {
        address: string;
        limit?: number;
        type?: string;
        before?: number;
        after?: number;
        startTime?: number;
        endTime?: number;
    }
): Promise<{
    txs: Transaction[];
    pagination: ExchangePagination;
}> {
    return this.request({
        method: (params: {
            address: string;
            limit?: number;
            type?: string;
            before?: number;
            after?: number;
            startTime?: number;
            endTime?: number;
        }) => this.indexerGrpcExplorerApi.fetchAccountTx(params),
        params,
    });
}

export function getValidator(
    this: InjectiveGrpcBase,
    validatorAddress: string
): Promise<ExplorerValidator> {
    return this.request({
        method: (params: string) =>
            this.indexerGrpcExplorerApi.fetchValidator(params),
        params: validatorAddress,
    });
}

export function getValidatorUptime(
    this: InjectiveGrpcBase,
    validatorAddress: string
): Promise<ValidatorUptime[]> {
    return this.request({
        method: (params: string) =>
            this.indexerGrpcExplorerApi.fetchValidatorUptime(params),
        params: validatorAddress,
    });
}

export function getPeggyDepositTxs(
    this: InjectiveGrpcBase,
    params: {
        receiver?: string;
        sender?: string;
        limit?: number;
        skip?: number;
    }
): Promise<PeggyDepositTx[]> {
    return this.request({
        method: (params: {
            receiver?: string;
            sender?: string;
            limit?: number;
            skip?: number;
        }) => this.indexerGrpcExplorerApi.fetchPeggyDepositTxs(params),
        params,
    });
}

export function getPeggyWithdrawalTxs(
    this: InjectiveGrpcBase,
    params: {
        sender?: string;
        receiver?: string;
        limit?: number;
        skip?: number;
    }
): Promise<PeggyWithdrawalTx[]> {
    return this.request({
        method: (params: {
            sender?: string;
            receiver?: string;
            limit?: number;
            skip?: number;
        }) => this.indexerGrpcExplorerApi.fetchPeggyWithdrawalTxs(params),
        params,
    });
}

export function getBlocks(
    this: InjectiveGrpcBase,
    params: {
        before?: number;
        after?: number;
        limit?: number;
        from?: number;
        to?: number;
    }
): Promise<InjectiveExplorerRpc.GetBlocksResponse> {
    return this.request({
        method: (params: {
            before?: number;
            after?: number;
            limit?: number;
            from?: number;
            to?: number;
        }) => this.indexerGrpcExplorerApi.fetchBlocks(params),
        params,
    });
}

export function getBlock(
    this: InjectiveGrpcBase,
    id: string
): Promise<InjectiveExplorerRpc.GetBlockResponse> {
    return this.request({
        method: (params: string) =>
            this.indexerGrpcExplorerApi.fetchBlock(params),
        params: id,
    });
}

export function getTxs(
    this: InjectiveGrpcBase,
    params: {
        before?: number;
        after?: number;
        limit?: number;
        skip?: number;
        type?: string;
        startTime?: number;
        endTime?: number;
        chainModule?: string;
    }
): Promise<InjectiveExplorerRpc.GetTxsResponse> {
    return this.request({
        method: (params: {
            before?: number;
            after?: number;
            limit?: number;
            skip?: number;
            type?: string;
            startTime?: number;
            endTime?: number;
            chainModule?: string;
        }) => this.indexerGrpcExplorerApi.fetchTxs(params),
        params,
    });
}

export function getIBCTransferTxs(
    this: InjectiveGrpcBase,
    params: {
        sender?: string;
        receiver?: string;
        srcChannel?: string;
        srcPort?: string;
        destChannel?: string;
        destPort?: string;
        limit?: number;
        skip?: number;
    }
): Promise<IBCTransferTx[]> {
    return this.request({
        method: (params: {
            sender?: string;
            receiver?: string;
            srcChannel?: string;
            srcPort?: string;
            destChannel?: string;
            destPort?: string;
            limit?: number;
            skip?: number;
        }) => this.indexerGrpcExplorerApi.fetchIBCTransferTxs(params),
        params,
    });
}

export function getExplorerStats(
    this: InjectiveGrpcBase
): Promise<ExplorerStats> {
    return this.request({
        method: (params: any) =>
            this.indexerGrpcExplorerApi.fetchExplorerStats(),
        params: {},
    });
}
