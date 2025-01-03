import { InjectiveGrpcBase } from "../grpc/grpc-base";
import { CosmosGovV1Gov } from "@injectivelabs/core-proto-ts";
import {
    GovModuleStateParams,
    Proposal,
    ProposalDeposit,
    Vote,
    TallyResult,
    PaginationOption,
    Pagination,
} from "@injectivelabs/sdk-ts";

export function getGovernanceModuleParams(
    this: InjectiveGrpcBase
): Promise<GovModuleStateParams> {
    return this.request({
        method: this.chainGrpcGovApi.fetchModuleParams,
        params: {},
    });
}

export function getProposals(
    this: InjectiveGrpcBase,
    params: {
        status: CosmosGovV1Gov.ProposalStatus;
        pagination?: PaginationOption;
    }
): Promise<{
    proposals: Proposal[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcGovApi.fetchProposals,
        params,
    });
}

export function getProposal(
    this: InjectiveGrpcBase,
    proposalId: number
): Promise<Proposal> {
    return this.request({
        method: this.chainGrpcGovApi.fetchProposal,
        params: proposalId,
    });
}

export function getProposalDeposits(
    this: InjectiveGrpcBase,
    params: {
        proposalId: number;
        pagination?: PaginationOption;
    }
): Promise<{
    deposits: ProposalDeposit[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcGovApi.fetchProposalDeposits,
        params,
    });
}

export function getProposalVotes(
    this: InjectiveGrpcBase,
    params: {
        proposalId: number;
        pagination?: PaginationOption;
    }
): Promise<{
    votes: Vote[];
    pagination: Pagination;
}> {
    return this.request({
        method: this.chainGrpcGovApi.fetchProposalVotes,
        params,
    });
}

export function getProposalTally(
    this: InjectiveGrpcBase,
    proposalId: number
): Promise<TallyResult> {
    return this.request({
        method: this.chainGrpcGovApi.fetchProposalTally,
        params: proposalId,
    });
}
