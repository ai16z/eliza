import {Content} from "@elizaos/core";

export const nativeTokenConstant = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export interface XChainSwapContent extends Content {
    fromToken: string;
    toToken: string;
    fromChain: string;
    toChain: string;
    amount: string | number;
    toAddress: string;
}

export interface SquidToken {
    address: string;
    isNative: boolean;
    symbol: string;
    decimals: number;
    enabled: boolean;
}
