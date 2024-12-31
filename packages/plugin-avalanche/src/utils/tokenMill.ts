import { getAccount, getWalletClient, getPublicClient } from "./index";
import { TOKEN_ADDRESSES, TOKEN_MILL_CONFIG } from "./constants";
import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { TokenMillMarketCreationParameters } from "../types";
import { Address, encodeAbiParameters, parseUnits } from "viem";

export const createMarketAndToken = async (
    runtime: IAgentRuntime,
    name: string,
    symbol: string
) => {
    const account = getAccount(runtime);
    const publicClient = getPublicClient(runtime);
    const abi = [
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: "uint96",
                            name: "tokenType",
                            type: "uint96",
                        },
                        {
                            internalType: "string",
                            name: "name",
                            type: "string",
                        },
                        {
                            internalType: "string",
                            name: "symbol",
                            type: "string",
                        },
                        {
                            internalType: "address",
                            name: "quoteToken",
                            type: "address",
                        },
                        {
                            internalType: "uint256",
                            name: "totalSupply",
                            type: "uint256",
                        },
                        {
                            internalType: "uint16",
                            name: "creatorShare",
                            type: "uint16",
                        },
                        {
                            internalType: "uint16",
                            name: "stakingShare",
                            type: "uint16",
                        },
                        {
                            internalType: "uint256[]",
                            name: "bidPrices",
                            type: "uint256[]",
                        },
                        {
                            internalType: "uint256[]",
                            name: "askPrices",
                            type: "uint256[]",
                        },
                        {
                            internalType: "bytes",
                            name: "args",
                            type: "bytes",
                        },
                    ],
                    internalType: "struct ITMFactory.MarketCreationParameters",
                    name: "parameters",
                    type: "tuple",
                },
            ],
            name: "createMarketAndToken",
            outputs: [
                {
                    internalType: "address",
                    name: "baseToken",
                    type: "address",
                },
                {
                    internalType: "address",
                    name: "market",
                    type: "address",
                },
            ],
            stateMutability: "nonpayable",
            type: "function",
        },
    ];

    if (name.length == 0) {
        throw new Error("Name must be provided");
    }

    if (name.length > 32) {
        throw new Error("Name must be less than 12 characters");
    }

    if (symbol.length == 0) {
        throw new Error("Symbol must be provided");
    }

    if (symbol.length > 8) {
        throw new Error("Symbol must be less than 8 characters");
    }

    const params: TokenMillMarketCreationParameters = {
        tokenType: 1,
        name,
        symbol,
        quoteToken: TOKEN_ADDRESSES.WAVAX,
        totalSupply: parseUnits("100000000", 18),
        creatorShare: 2000,
        stakingShare: 6000,
        bidPrices: [
            0, 0.018117, 0.042669, 0.075735, 0.12078, 0.18018, 0.26235,
            0.37124999999999997, 0.51975, 0.71973, 0.99,
        ].map((price) => parseUnits(price.toString(), 18)),
        askPrices: [
            0, 0.0183, 0.0431, 0.0765, 0.122, 0.182, 0.265, 0.375, 0.525, 0.727,
            1,
        ].map((price) => parseUnits(price.toString(), 18)),
        args: encodeAbiParameters(
            [{ name: "decimals", type: "uint256" }],
            [18n]
        ),
    };

    const { result, request } = await publicClient.simulateContract({
        account,
        address: TOKEN_MILL_CONFIG.factory as Address,
        abi,
        functionName: "createMarketAndToken",
        args: [params],
    });

    if (!result) {
        throw new Error("Create failed");
    }

    elizaLogger.debug("request", request);
    elizaLogger.debug("result", result);

    elizaLogger.debug("Request:", request);

    const walletClient = getWalletClient(runtime);
    const tx = await walletClient.writeContract(request);
    elizaLogger.log("Transaction:", tx);

    return {
        tx: tx,
        baseToken: result[0],
        market: result[1],
    };
};
