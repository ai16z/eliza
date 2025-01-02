import type { IAgentRuntime, Memory, State } from "@ai16z/eliza";
import { WalletProvider } from "../providers/wallet";
import { executeProposalTemplate } from "../templates";
import type { ExecuteProposalParams, Transaction } from "../types";
import governorArtifacts from "../contracts/artifacts/OZGovernor.json";
import {
    ByteArray,
    Hex,
    encodeFunctionData,
    getContract,
    keccak256,
    stringToHex,
} from "viem";
import { Chain } from "viem";
import voteTokenArtifacts from "../contracts/artifacts/VoteToken.json";

export { executeProposalTemplate };

export class ExecuteAction {
    constructor(private walletProvider: WalletProvider) {
        this.walletProvider = walletProvider;
    }

    async execute(params: ExecuteProposalParams): Promise<Transaction> {
        const walletClient = this.walletProvider.getWalletClient(params.chain);

        const descriptionHash = keccak256(stringToHex(params.description));

        const txData = encodeFunctionData({
            abi: governorArtifacts.abi,
            functionName: "execute",
            args: [
                params.targets,
                params.values,
                params.calldatas,
                descriptionHash,
            ],
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

export const executeAction = {
    name: "execute",
    description: "Execute a DAO governance proposal",
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
            const action = new ExecuteAction(walletProvider);
            return await action.execute(options);
        } catch (error) {
            console.error("Error in vote handler:", error.message);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    template: executeProposalTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Execute proposal 123 on the governor at 0x1234567890123456789012345678901234567890 on Ethereum",
                    action: "EXECUTE_PROPOSAL",
                },
            },
        ],
    ],
    similes: ["EXECUTE_PROPOSAL", "GOVERNANCE_EXECUTE"],
}; // TODO: add more examples
