import type { IAgentRuntime, Memory, State } from "@ai16z/eliza";
import { WalletProvider } from "../providers/wallet";
import { voteTemplate } from "../templates";
import type { Transaction, VoteParams } from "../types";
import governorArtifacts from "../contracts/artifacts/OZGovernor.json";
import { ByteArray, Hex, encodeFunctionData, getContract } from "viem";
import { Chain } from "viem";
import voteTokenArtifacts from "../contracts/artifacts/VoteToken.json";

export { voteTemplate };

export class VoteAction {
    constructor(private walletProvider: WalletProvider) {
        this.walletProvider = walletProvider;
    }

    async vote(params: VoteParams): Promise<Transaction> {
        const walletClient = this.walletProvider.getWalletClient(params.chain);

        const proposalId = BigInt(params.proposalId.toString());
        const support = BigInt(params.support.toString());

        const txData = encodeFunctionData({
            abi: governorArtifacts.abi,
            functionName: "castVote",
            args: [proposalId, support],
        });

        try {
            const chainConfig = this.walletProvider.getChainConfigs(
                params.chain
            );

            // Log current block before sending transaction
            const publicClient = this.walletProvider.getPublicClient(
                params.chain
            );

            const hash = await walletClient.sendTransaction({
                account: walletClient.account,
                to: params.governor,
                value: BigInt(0),
                data: txData as Hex,
                chain: chainConfig,
                kzg: {
                    blobToKzgCommitment: function (blob: ByteArray): ByteArray {
                        throw new Error("Function not implemented.");
                    },
                    computeBlobKzgProof: function (
                        blob: ByteArray,
                        commitment: ByteArray
                    ): ByteArray {
                        throw new Error("Function not implemented.");
                    },
                },
            });

            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
            });

            return {
                hash,
                from: walletClient.account.address,
                to: params.governor,
                value: BigInt(0),
                data: txData as Hex,
                chainId: this.walletProvider.getChainConfigs(params.chain).id,
                logs: receipt.logs,
            };
        } catch (error) {
            throw new Error(`Vote failed: ${error.message}`);
        }
    }
}

export const voteAction = {
    name: "vote",
    description: "Vote for a DAO governance proposal",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback?: any
    ) => {
        try {
            const privateKey = runtime.getSetting(
                "EVM_PRIVATE_KEY"
            ) as `0x${string}`;
            const walletProvider = new WalletProvider(privateKey);
            const action = new VoteAction(walletProvider);
            return await action.vote(options);
        } catch (error) {
            console.error("Error in vote handler:", error.message);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    template: voteTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Vote yes on proposal 123 on the governor at 0x1234567890123456789012345678901234567890 on Ethereum",
                    action: "GOVERNANCE_VOTE",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Vote no on proposal 456 on the governor at 0xabcdef1111111111111111111111111111111111 on Ethereum",
                    action: "GOVERNANCE_VOTE",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Abstain from voting on proposal 789 on the governor at 0x0000111122223333444455556666777788889999 on Ethereum",
                    action: "GOVERNANCE_VOTE",
                },
            },
        ],
    ],
    similes: ["VOTE", "GOVERNANCE_VOTE", "CAST_VOTE"],
}; // TODO: add more examples
