import { Account, Chain, Client, Transport } from "viem";
import { WalletProvider } from "../providers/wallet";
import { TokenProvider } from "../providers/token";
import type {
    CheckTokenBalanceParams,
    SupportedChain,
    TokenWithBalance,
} from "../types";
import { checkTokenBalanceTemplate } from "../templates";
import {
    composeContext,
    elizaLogger,
    generateMessageResponse,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@ai16z/eliza";

export { checkTokenBalanceTemplate };
export class CheckTokenBalanceAction {
    constructor(
        private walletProvider: WalletProvider,
        private tokenProvider: TokenProvider
    ) {}

    async checkTokenBalance(
        params: CheckTokenBalanceParams
    ): Promise<TokenWithBalance> {
        const walletClient = this.walletProvider.getWalletClient();
        const walletAddress = await walletClient.account.address;
        const walletToCheck = params.walletToCheck || walletAddress;

        try {
            const result = await this.tokenProvider.getTokenBalance(
                params.tokenAddress,
                walletToCheck,
                params.chainToCheck
            );

            elizaLogger.log("Token balance:", result);
            return result;
        } catch (error) {
            throw new Error(`Check balance failed: ${error.message}`);
        }
    }

    async checkAgentTokenBalance(
        params: CheckTokenBalanceParams
    ): Promise<TokenWithBalance> {
        try {
            const result = await this.tokenProvider.getAgentTokenBalance(
                params.tokenAddress
            );

            elizaLogger.log("Token balance:", result);
            return result;
        } catch (error) {
            throw new Error(`Check balance failed: ${error.message}`);
        }
    }
}

export const checkTokenBalanceAction = {
    name: "checkTokenBalance",
    description:
        "Checks the balance of a token for a given wallet on a given chain",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any
    ) => {
        const walletProvider = new WalletProvider(runtime);
        const tokenProvider = new TokenProvider(walletProvider);
        const action = new CheckTokenBalanceAction(
            walletProvider,
            tokenProvider
        );

        const context = composeContext({
            state,
            template: checkTokenBalanceTemplate,
        });

        const response = await generateMessageResponse({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        elizaLogger.log("Check balance response:", response);

        const {
            tokenAddress,
            walletToCheck,
            chainToCheck,
            checkAgentTokenBalance,
        } = response;

        const checkTokenBalanceParams: CheckTokenBalanceParams = {
            tokenAddress: tokenAddress as `0x${string}`,
            walletToCheck: walletToCheck as `0x${string}`,
            chainToCheck: chainToCheck as SupportedChain,
        };

        return checkAgentTokenBalance
            ? action.checkAgentTokenBalance(checkTokenBalanceParams)
            : action.checkTokenBalance(checkTokenBalanceParams);
    },
    template: checkTokenBalanceTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "How many tokens of 0x742d35Cc6634C0532925a3b844Bc454e4438f44e do you have?",
                    action: "CHECK_TOKEN_BALANCE",
                },
            },
            {
                user: "user",
                content: {
                    text: "How much $MOG do you have?",
                    action: "CHECK_YOUR_TOKEN_BALANCE",
                },
            },
            {
                user: "user",
                content: {
                    text: "How many tokens do you have on this contract? 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "CHECK_AGENT_TOKEN_BALANCE",
                },
            },
            {
                user: "user",
                content: {
                    text: "How many $SPX tokens do you have?",
                    action: "TOKEN_BALANCE",
                },
            },
            {
                user: "user",
                content: {
                    text: "How much $PEPE do you have on ETH?",
                    action: "CHECK_TOKEN_BALANCE",
                },
            },
            {
                user: "user",
                content: {
                    text: "How much $PEPE do you have on ethereum?",
                    action: "CHECK_TOKEN_AMOUNT",
                },
            },
            {
                user: "user",
                content: {
                    text: "How many $SPX tokens do you have on ApeChain?",
                    action: "CHECK_TOKEN_BALANCE",
                },
            },
            {
                user: "user",
                content: {
                    text: "How much $MOG does this wallet have in it? 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "CHECK_WALLET_TOKEN_AMOUNT",
                },
            },
            {
                user: "user",
                content: {
                    text: "Look at this wallet 0x742d35Cc6634C0532925a3b844Bc454e4438f44e and see how much $MOG it has",
                    action: "CHECK_WALLET_TOKEN_AMOUNT",
                },
            },
            {
                user: "user",
                content: {
                    text: "Look at this wallet 0x742d35Cc6634C0532925a3b844Bc454e4438f44e and see how much of this token it has: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "CHECK_WALLET_TOKEN_AMOUNT",
                },
            },
        ],
    ],
    similes: [
        "CHECK_TOKEN_BALANCE",
        "CHECK_WALLET_BALANCE",
        "BALANCE_CHECK",
        "CHECK_TOKEN_VALUE",
        "CHECK_TOKEN_AMOUNT",
        "CHECK_WALLET_TOKEN_AMOUNT",
        "LOOK_AT_WALLET_TOKEN_AMOUNT",
        "CHECK_AGENT_TOKEN_BALANCE",
        "CHECK_AGENT_TOKEN_AMOUNT",
        "CHECK_YOUR_TOKEN_BALANCE",
    ],
};
