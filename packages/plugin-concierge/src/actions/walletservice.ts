import {
    Action,
    IAgentRuntime,
    State,
    HandlerCallback,
    Memory,
    elizaLogger,
    ModelClass,
    generateObject,
    composeContext,
} from "@ai16z/eliza";
import { baselinks } from "./baselinks";
import { WalletService } from "./cdp";
import {
    FundSchema,
    TransferSchema,
    BalanceSchema,
    WithdrawSchema,
    WalletSchema,
    SwapSchema,
    isFundContent,
    isTransferContent,
    isBalanceContent,
    isWithdrawContent,
    isWalletContent,
    isSwapContent,
    isShowPrivateKeyContent,
    ShowPrivateKeySchema,
} from "./types";
import {
    fundTemplate,
    transferTemplate,
    balanceTemplate,
    withdrawTemplate,
    swapTemplate,
    walletTemplate,
    showPrivateKeyTemplate,
} from "./templates";

const send = async (callback: HandlerCallback, text: string) => {
    try {
        await callback({ text: text }, []);
    } catch (error) {
        console.error(error);
        await callback(
            { text: "Failed to create resource. Please check the logs." },
            []
        );
    }
};

let walletService: WalletService = undefined;
const singleTonWalletService = (senderAddress: string) => {
    if (!walletService) {
        elizaLogger.success("Creating new wallet service for", senderAddress);
        walletService = new WalletService(senderAddress);
    }
    return walletService;
};
// Example action implementation
export const fundAction: Action = {
    name: "FUND_WALLET",
    similes: [
        "LOAD_WALLET",
        "ADD_FUNDS_TO_WALLET",
        "ADD_FUNDS_TO_AGENT_WALLET",
        "ADD_FUNDS",
    ],
    description: "Fund your agent wallet with USDC.",
    examples: [
        [
            {
                user: "John",
                content: { text: "Fund my agent wallet with 10 USDC" },
            },
        ],
        [
            {
                user: "John",
                content: { text: "Add 10 USDC to my agent wallet" },
            },
        ],
        [
            {
                user: "John",
                content: { text: "Add funds to my agent wallet" },
            },
        ],
        [
            {
                user: "John",
                content: { text: "Add 10" },
            },
        ],
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        const context = composeContext({
            state,
            template: fundTemplate,
        });

        const resourceDetails = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
            schema: FundSchema,
        });
        if (!isFundContent(resourceDetails.object)) {
            callback({ text: "Invalid resource details provided." }, []);
            return;
        }

        const params = resourceDetails.object;
        const senderAddress = state.senderName;
        const amount = params.amount; // || options.amount;

        if (amount <= 0) {
            send(callback, "Please specify a valid amount to fund.");
            return;
        }
        walletService = singleTonWalletService(senderAddress);
        const walletData = await walletService.getWallet(senderAddress);
        if (!walletData) {
            send(callback, "You don't have an agent wallet.");
            return;
        }
        const { balance } = await walletService.checkBalance(senderAddress);
        if (Number(balance) + amount > 10) {
            send(callback, "You have maxed out your funds. Max 10 USDC.");
            return;
        }
        // const onRampURL = await walletService.onRampURL(
        //     amount,
        //     walletData.agent_address
        // );
        const url = await baselinks.paymentLink(
            walletData.agent_address,
            amount
        );
        await send(callback, `Here is the payment link`);
        await send(callback, url);
    },
};
export const showPrivateKey: Action = {
    name: "SHOW_PRIVATE_KEY",
    similes: ["SHOW_PRIVATE_KEY", "SHOW_PRIVATE_KEY_OF_AGENT_WALLET"],
    description: "Show the private key of your agent wallet.",
    examples: [
        [
            {
                user: "John",
                content: { text: "Show my private key" },
            },
        ],
    ],

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        const context = composeContext({
            state,
            template: showPrivateKeyTemplate,
        });

        const resourceDetails = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
            schema: ShowPrivateKeySchema,
        });
        if (!isShowPrivateKeyContent(resourceDetails.object)) {
            callback({ text: "Invalid resource details provided." }, []);
            return;
        }
        const params = resourceDetails.object;
        const senderAddress = params.address || state.senderName;
        walletService = singleTonWalletService(senderAddress);
        const walletData = await walletService.getWallet(senderAddress);
        if (!walletData) {
            send(callback, "You don't have an agent wallet.");
            return;
        }
        console.log("walletData", walletData);
        await send(callback, `Your wallet seed: ${walletData.wallet.seed}`);
    },
};
export const transferAction: Action = {
    name: "TRANSFER_USDC",
    similes: ["SEND_USDC", "SEND_FUNDS", "SEND_FUNDS_TO_USER"],
    description: "Transfer USDC to another user.",
    examples: [
        [
            {
                user: "John",
                content: { text: "Send 10 USDC to vitalik.eth" },
            },
        ],
        [
            {
                user: "John",
                content: { text: "Send @fabri 10 USDC" },
            },
        ],
        [
            {
                user: "John",
                content: { text: "Send 0x1234567890... 10 USDC" },
            },
        ],
        [
            {
                user: "John",
                content: { text: "transfer 0.01 USDC to 0x1234567890..." },
            },
        ],
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        const context = composeContext({
            state,
            template: transferTemplate,
        });

        const resourceDetails = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
            schema: TransferSchema,
        });
        if (!isTransferContent(resourceDetails.object)) {
            callback({ text: "Invalid resource details provided." }, []);
            return;
        }
        const params = resourceDetails.object;
        const senderAddress = state.senderName;
        const recipientAddress = params.recipient;
        const amount = params.amount;

        walletService = singleTonWalletService(senderAddress);

        const { balance } = await walletService.checkBalance(senderAddress);
        if (balance < amount) {
            send(callback, "You have no funds to transfer.");
            return;
        }

        if (!recipientAddress) {
            send(callback, "User not found.");
            return;
        }

        await send(
            callback,
            `Transferring ${amount} USDC to ${recipientAddress}`
        );
        const tx = await walletService.transfer(
            senderAddress,
            recipientAddress,
            amount
        );
        let msg = `Transfer completed!`;
        if (tx.getTransactionHash()) {
            msg += `\nTransaction hash: ${tx.getTransactionHash()}`;
        }
        await send(callback, msg);
        //await notifyUser(senderAddress, recipientAddress, tx, amount);
    },
};

export const balanceAction: Action = {
    name: "BALANCE_USDC",
    similes: ["CHECK_BALANCE", "CHECK_USDC_BALANCE", "CHECK_BALANCE_USDC"],
    description:
        "Check your USDC wallet balance. Assume that the user has a USDC wallet.",
    examples: [
        [
            {
                user: "John",
                content: { text: "Check my balance" },
            },
        ],
        [
            {
                user: "John",
                content: { text: "Check my balance" },
            },
        ],
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        const context = composeContext({
            state,
            template: balanceTemplate,
        });

        const resourceDetails = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
            schema: BalanceSchema,
        });
        if (!isBalanceContent(resourceDetails.object)) {
            callback({ text: "Invalid resource details provided." }, []);
            return;
        }
        const params = resourceDetails.object;
        const senderAddress = params.address || state.senderName; //?? message.sender.address;
        walletService = singleTonWalletService(senderAddress);

        const { balance } = await walletService.checkBalance(senderAddress);
        send(callback, `Your agent wallet has a balance of $${balance}`);
    },
};

export const withdrawAction: Action = {
    name: "WITHDRAW_USDC",
    similes: [
        "WITHDRAW_FUNDS",
        "WITHDRAW_FUNDS_FROM_WALLET",
        "WITHDRAW_FUNDS_FROM_AGENT_WALLET",
    ],
    description: "Withdraw USDC from your agent wallet.",
    examples: [
        [
            {
                user: "John",
                content: { text: "Withdraw 0.01 USDC from my agent wallet" },
            },
        ],
        [
            {
                user: "John",
                content: { text: "Withdraw all my funds" },
            },
        ],
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        const context = composeContext({
            state,
            template: withdrawTemplate,
        });

        const resourceDetails = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
            schema: WithdrawSchema,
        });
        if (!isWithdrawContent(resourceDetails.object)) {
            callback({ text: "Invalid resource details provided." }, []);
            return;
        }
        const params = resourceDetails.object;
        const senderAddress = state.senderName; //?? message.sender.address;
        walletService = singleTonWalletService(senderAddress);
        const amount = params.amount; //|| opti     ons.amount;
        const walletData = await walletService.getWallet(senderAddress);
        if (!walletData) return undefined;
        elizaLogger.info(`Retrieved wallet data for ${senderAddress}`);
        const { balance } = await walletService.checkBalance(senderAddress);
        if (amount && amount <= 0) {
            send(
                callback,
                "Please specify a valid positive amount to withdraw."
            );
            return;
        }
        if (amount && amount > Number(balance)) {
            send(callback, "You don't have enough funds to withdraw.");
            return;
        }
        const toWithdraw = amount ?? Number(balance);
        if (toWithdraw <= Number(balance)) {
            const transfer = await walletService.transfer(
                senderAddress,
                senderAddress,
                toWithdraw
            );
            let msg = `Transfer completed!`;
            if (transfer.getTransactionHash()) {
                msg += `\nTransaction hash: ${transfer.getTransactionHash()}`;
            }
            await send(callback, msg);
        }
    },
};

export const walletDetailsAction: Action = {
    name: "WALLET_DETAILS",
    similes: ["CHECK_ADDRESS", "CHECK_AGENT_ADDRESS", "CHECK_WALLET_ADDRESS"],
    description: "Check your agent wallet address/status/balance.",
    examples: [
        [
            {
                user: "John",
                content: { text: "Check my agent wallet address" },
            },
        ],
        [
            {
                user: "John",
                content: { text: "Check my address" },
            },
        ],
        [
            {
                user: "John",
                content: { text: "Check my agent wallet" },
            },
        ],
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        const context = composeContext({
            state,
            template: walletTemplate,
        });

        const resourceDetails = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
            schema: WalletSchema,
        });
        if (!isWalletContent(resourceDetails.object)) {
            callback({ text: "Invalid resource details provided." }, []);
            return;
        }
        const params = resourceDetails.object;
        const senderAddress = params.address || state.senderName; //?? message.sender.address;
        walletService = singleTonWalletService(senderAddress);
        const walletExist = await walletService.getWallet(senderAddress);
        if (walletExist) {
            const { balance } = await walletService.checkBalance(senderAddress);
            send(callback, "Your agent wallet address");
            const url = await baselinks.walletDetails(
                walletExist.address,
                walletExist.agent_address,
                balance
            );
            send(callback, url);
            return;
        }
        send(callback, "You don't have an agent wallet.");
    },
};

export const swapAction: Action = {
    name: "SWAP_USDC",
    similes: ["SWAP_TOKENS", "SWAP_ETH_TO_USDC", "SWAP_USDC_TO_ETH"],
    description: "Swap between tokens (e.g., ETH to USDC).",
    examples: [
        [
            {
                user: "John",
                content: { text: "Swap 0.01 ETH to USDC" },
            },
        ],
        [
            {
                user: "John",
                content: { text: "Swap 0.01 USDC to ETH" },
            },
        ],
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        const context = composeContext({
            state,
            template: swapTemplate,
        });

        const resourceDetails = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
            schema: SwapSchema,
        });
        if (!isSwapContent(resourceDetails.object)) {
            callback({ text: "Invalid resource details provided." }, []);
            return;
        }
        const params = resourceDetails.object;
        const senderAddress = state.senderName;
        const amount = params.amount;
        const fromToken = params.fromToken;
        const toToken = params.toToken;
        walletService = singleTonWalletService(senderAddress);
        await send(callback, `Swapping ${amount} ${fromToken} to ${toToken}`);
        const tx = await walletService.swap(
            senderAddress,
            fromToken,
            toToken,
            amount
        );
        let msg = `Swap completed!`;
        if (tx.getTransaction()) {
            msg += `\nTransaction hash: ${tx.getTransaction()}`;
        }
        await send(callback, msg);
    },
};
