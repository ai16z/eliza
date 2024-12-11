import {
    Address,
    CalldataEncodable,
    TransactionHash,
    TransactionStatus,
} from "genlayer-js/types";

// Action parameters
export interface ReadContractParams {
    contractAddress: Address;
    functionName: string;
    functionArgs: any[];
}

export interface WriteContractParams {
    contractAddress: Address;
    functionName: string;
    functionArgs: CalldataEncodable[];
    value: bigint;
    leaderOnly?: boolean;
}

export interface DeployContractParams {
    code_file: string;
    args: CalldataEncodable[];
    leaderOnly?: boolean;
}

export interface GetTransactionParams {
    hash: TransactionHash;
}

export interface GetCurrentNonceParams {
    address: string;
}

export interface WaitForTransactionReceiptParams {
    hash: TransactionHash;
    status?: TransactionStatus;
    interval?: number;
    retries?: number;
}

export interface GetContractSchemaParams {
    address: string;
}

export interface GetContractSchemaForCodeParams {
    contractCode: string;
}
