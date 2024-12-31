import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import {
    createPublicClient,
    createWalletClient,
    Hash,
    http,
    Address,
    parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalanche } from "viem/chains";
import { YakSwapQuote } from "../types";
import { YAK_SWAP_CONFIG } from "./constants";

export const getAccount = (runtime: IAgentRuntime) => {
    const privateKey =
        runtime.getSetting("AVALANCHE_PRIVATE_KEY") ||
        process.env.AVALANCHE_PRIVATE_KEY;
    return privateKeyToAccount(`0x${privateKey.replace("0x", "")}`);
};

export const getPublicClient = (_runtime: IAgentRuntime) => {
    return createPublicClient({
        chain: avalanche,
        transport: http(),
    });
};

export const getWalletClient = (runtime: IAgentRuntime) => {
    return createWalletClient({
        account: getAccount(runtime),
        chain: avalanche,
        transport: http(),
    });
};

export const getTxReceipt = async (runtime: IAgentRuntime, tx: Hash) => {
    const publicClient = getPublicClient(runtime);
    const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
    });
    return receipt;
};

export const getDecimals = async (
    runtime: IAgentRuntime,
    tokenAddress: Address
) => {
    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
        return avalanche.nativeCurrency.decimals;
    }
    const publicClient = getPublicClient(runtime);
    const decimals = await publicClient.readContract({
        address: tokenAddress,
        abi: [
            {
                inputs: [],
                name: "decimals",
                outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
                stateMutability: "view",
                type: "function",
            },
        ],
        functionName: "decimals",
    });
    return decimals;
};

export const getNativeBalance = async (
    runtime: IAgentRuntime,
    owner: Address
) => {
    const publicClient = getPublicClient(runtime);
    const balance = await publicClient.getBalance({
        address: owner,
    });
    return balance;
};

export const getTokenBalance = async (
    runtime: IAgentRuntime,
    tokenAddress: Address,
    owner: Address
) => {
    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
        return getNativeBalance(runtime, owner);
    }
    const publicClient = getPublicClient(runtime);
    const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: [
            {
                inputs: [
                    {
                        internalType: "address",
                        name: "account",
                        type: "address",
                    },
                ],
                name: "balanceOf",
                outputs: [
                    { internalType: "uint256", name: "", type: "uint256" },
                ],
                stateMutability: "view",
                type: "function",
            },
        ],
        functionName: "balanceOf",
        args: [owner],
    });
    return balance;
};

export const getQuote = async (
    runtime: IAgentRuntime,
    fromTokenAddress: Address,
    toTokenAddress: Address,
    amount: number
) => {
    const publicClient = getPublicClient(runtime);
    const decimals = await getDecimals(runtime, fromTokenAddress);
    const maxSteps = 2;
    const gasPrice = parseUnits("25", "gwei"); // todo: get gas price from runtime
    const quote = await publicClient.readContract({
        address: YAK_SWAP_CONFIG.router,
        abi: [
            {
                inputs: [
                    {
                        internalType: "uint256",
                        name: "_amountIn",
                        type: "uint256",
                    },
                    {
                        internalType: "address",
                        name: "_tokenIn",
                        type: "address",
                    },
                    {
                        internalType: "address",
                        name: "_tokenOut",
                        type: "address",
                    },
                    {
                        internalType: "uint256",
                        name: "_maxSteps",
                        type: "uint256",
                    },
                    {
                        internalType: "uint256",
                        name: "_gasPrice",
                        type: "uint256",
                    },
                ],
                name: "findBestPathWithGas",
                outputs: [
                    {
                        components: [
                            {
                                internalType: "uint256[]",
                                name: "amounts",
                                type: "uint256[]",
                            },
                            {
                                internalType: "address[]",
                                name: "adapters",
                                type: "address[]",
                            },
                            {
                                internalType: "address[]",
                                name: "path",
                                type: "address[]",
                            },
                            {
                                internalType: "uint256",
                                name: "gasEstimate",
                                type: "uint256",
                            },
                        ],
                        internalType: "struct YakRouter.FormattedOfferWithGas",
                        name: "",
                        type: "tuple",
                    },
                ],
                stateMutability: "view",
                type: "function",
            },
        ],
        functionName: "findBestPathWithGas",
        args: [
            parseUnits(amount.toString(), decimals),
            fromTokenAddress,
            toTokenAddress,
            maxSteps,
            gasPrice,
        ],
    });
    elizaLogger.log("Quote:", quote);
    return quote as YakSwapQuote;
};

export const sendNativeAsset = async (
    runtime: IAgentRuntime,
    recipient: Address,
    amount: number
) => {
    const walletClient = getWalletClient(runtime);
    const decimals = await getDecimals(
        runtime,
        "0x0000000000000000000000000000000000000000"
    );
    const tx = await walletClient.sendTransaction({
        to: recipient,
        value: parseUnits(amount.toString(), decimals),
    });
    return tx as Hash;
};

export const sendToken = async (
    runtime: IAgentRuntime,
    tokenAddress: Address,
    recipient: Address,
    amount: number
) => {
    const decimals = await getDecimals(runtime, tokenAddress);
    const publicClient = getPublicClient(runtime);

    try {
        const { result, request } = await publicClient.simulateContract({
            account: getAccount(runtime),
            address: tokenAddress,
            abi: [
                {
                    inputs: [
                        {
                            internalType: "address",
                            name: "dst",
                            type: "address",
                        },
                        {
                            internalType: "uint256",
                            name: "amount",
                            type: "uint256",
                        },
                    ],
                    name: "transfer",
                    outputs: [
                        {
                            internalType: "bool",
                            name: "",
                            type: "bool",
                        },
                    ],
                    stateMutability: "nonpayable",
                    type: "function",
                },
            ],
            functionName: "transfer",
            args: [recipient, parseUnits(amount.toString(), decimals)],
        });

        if (!result) {
            throw new Error("Transfer failed");
        }

        elizaLogger.debug("Request:", request);

        const walletClient = getWalletClient(runtime);
        const tx = await walletClient.writeContract(request);
        elizaLogger.log("Transaction:", tx);
        return tx as Hash;
    } catch (error) {
        elizaLogger.error("Error simulating contract:", error);
        return;
    }
};

export const approve = async (
    runtime: IAgentRuntime,
    tokenAddress: Address,
    spender: Address,
    amount: number
) => {
    try {
        const decimals = await getDecimals(runtime, tokenAddress);
        const publicClient = getPublicClient(runtime);
        const { result, request } = await publicClient.simulateContract({
            account: getAccount(runtime),
            address: tokenAddress,
            abi: [
                {
                    inputs: [
                        {
                            internalType: "address",
                            name: "_spender",
                            type: "address",
                        },
                        {
                            internalType: "uint256",
                            name: "_value",
                            type: "uint256",
                        },
                    ],
                    name: "approve",
                    outputs: [
                        {
                            internalType: "bool",
                            name: "",
                            type: "bool",
                        },
                    ],
                    stateMutability: "nonpayable",
                    type: "function",
                },
            ],
            functionName: "approve",
            args: [spender, parseUnits(amount.toString(), decimals)],
        });

        if (!result) {
            throw new Error("Approve failed");
        }

        elizaLogger.debug("Request:", request);

        const walletClient = getWalletClient(runtime);
        const tx = await walletClient.writeContract(request);
        elizaLogger.log("Transaction:", tx);
        return tx;
    } catch (error) {
        elizaLogger.error("Error approving:", error);
        return;
    }
};

export const swap = async (
    runtime: IAgentRuntime,
    quote: YakSwapQuote,
    recipient?: Address
) => {
    const slippageBips = 20n;
    const amountOut = quote.amounts[quote.amounts.length - 1];
    const allowedSlippage = (amountOut * slippageBips) / 10000n;
    const trade = {
        amountIn: quote.amounts[0],
        amountOut: amountOut - allowedSlippage,
        path: quote.path,
        adapters: quote.adapters,
    };
    try {
        const account = getAccount(runtime);
        const publicClient = getPublicClient(runtime);
        const { _result, request } = await publicClient.simulateContract({
            account: account,
            address: YAK_SWAP_CONFIG.router,
            abi: [
                {
                    inputs: [
                        {
                            components: [
                                {
                                    internalType: "uint256",
                                    name: "amountIn",
                                    type: "uint256",
                                },
                                {
                                    internalType: "uint256",
                                    name: "amountOut",
                                    type: "uint256",
                                },
                                {
                                    internalType: "address[]",
                                    name: "path",
                                    type: "address[]",
                                },
                                {
                                    internalType: "address[]",
                                    name: "adapters",
                                    type: "address[]",
                                },
                            ],
                            internalType: "struct YakRouter.Trade",
                            name: "_trade",
                            type: "tuple",
                        },
                        {
                            internalType: "address",
                            name: "_to",
                            type: "address",
                        },
                        {
                            internalType: "uint256",
                            name: "_fee",
                            type: "uint256",
                        },
                    ],
                    name: "swapNoSplit",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function",
                },
            ],
            functionName: "swapNoSplit",
            args: [trade, recipient || account.address, 0n],
        });

        elizaLogger.debug("Request:", request);

        const walletClient = getWalletClient(runtime);
        const tx = await walletClient.writeContract(request);
        elizaLogger.log("Transaction:", tx);
        return tx;
    } catch (error) {
        elizaLogger.error("Error simulating contract:", error);
        return;
    }
};

export const deposit = async (
    runtime: IAgentRuntime,
    depositTokenAddress: Address,
    strategyAddress: Address,
    amount: number
) => {
    try {
        const decimals = await getDecimals(runtime, depositTokenAddress);
        const publicClient = getPublicClient(runtime);
        const { _result, request } = await publicClient.simulateContract({
            account: getAccount(runtime),
            address: strategyAddress,
            abi: [
                {
                    inputs: [
                        {
                            internalType: "uint256",
                            name: "_amount",
                            type: "uint256",
                        },
                    ],
                    name: "deposit",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function",
                },
            ],
            functionName: "deposit",
            args: [parseUnits(amount.toString(), decimals)],
        });

        // if (!result) {
        //     throw new Error('Deposit failed')
        // }

        elizaLogger.debug("Request:", request);

        const walletClient = getWalletClient(runtime);
        const tx = await walletClient.writeContract(request);
        elizaLogger.log("Transaction:", tx);
        return tx;
    } catch (error) {
        elizaLogger.error("Error depositing:", error);
        return;
    }
};
