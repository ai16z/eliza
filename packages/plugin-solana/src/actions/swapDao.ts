import {
    ActionExample,
    IAgentRuntime,
    Memory,
    type Action,
} from "@ai16z/eliza";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getQuote } from "./swapUtils.ts";
import { getWalletKey } from "../keypairUtils.ts";

async function invokeSwapDao(
    connection: Connection,
    authority: Keypair,
    statePDA: PublicKey,
    walletPDA: PublicKey,
    instructionData: Buffer
): Promise<string> {
    const discriminator = new Uint8Array([
        25, 143, 207, 190, 174, 228, 130, 107,
    ]);

    // Combine discriminator and instructionData into a single Uint8Array
    const combinedData = new Uint8Array(
        discriminator.length + instructionData.length
    );
    combinedData.set(discriminator, 0);
    combinedData.set(instructionData, discriminator.length);

    const transaction = new Transaction().add({
        programId: new PublicKey("PROGRAM_ID"),
        keys: [
            { pubkey: authority.publicKey, isSigner: true, isWritable: true },
            { pubkey: statePDA, isSigner: false, isWritable: true },
            { pubkey: walletPDA, isSigner: false, isWritable: true },
        ],
        data: Buffer.from(combinedData),
    });

    const signature = await connection.sendTransaction(transaction, [
        authority,
    ]);
    await connection.confirmTransaction(signature);
    return signature;
}

async function promptConfirmation(): Promise<boolean> {
    // confirmation logic here
    const confirmSwap = window.confirm("Confirm the token swap?");
    return confirmSwap;
}

export const executeSwapForDAO: Action = {
    name: "EXECUTE_SWAP_DAO",
    similes: ["SWAP_TOKENS_DAO", "TOKEN_SWAP_DAO"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        console.log("Message:", message);
        return true;
    },
    description: "Perform a DAO token swap using execute_invoke.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory
    ): Promise<boolean> => {
        const { inputToken, outputToken, amount } = message.content;

        try {
            const connection = new Connection(
                runtime.getSetting("RPC_URL") as string
            );

            const { keypair: authority } = await getWalletKey(runtime, true);

            const daoMint = new PublicKey(runtime.getSetting("DAO_MINT")); // DAO mint address

            // Derive PDAs
            const [statePDA] = await PublicKey.findProgramAddress(
                [Buffer.from("state"), daoMint.toBuffer()],
                authority.publicKey
            );
            const [walletPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("wallet"), daoMint.toBuffer()],
                authority.publicKey
            );

            const quoteData = await getQuote(
                connection as Connection,
                inputToken as string,
                outputToken as string,
                amount as number
            );
            console.log("Swap Quote:", quoteData);

            const confirmSwap = await promptConfirmation();
            if (!confirmSwap) {
                console.log("Swap canceled by user");
                return false;
            }

            // Prepare instruction data for swap
            const instructionData = Buffer.from(
                JSON.stringify({
                    quote: quoteData.data,
                    userPublicKey: authority.publicKey.toString(),
                    wrapAndUnwrapSol: true,
                })
            );

            const txid = await invokeSwapDao(
                connection,
                authority,
                statePDA,
                walletPDA,
                instructionData
            );

            console.log("DAO Swap completed successfully!");
            console.log(`Transaction ID: ${txid}`);

            return true;
        } catch (error) {
            console.error("Error during DAO token swap:", error);
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    inputTokenSymbol: "SOL",
                    outputTokenSymbol: "USDC",
                    inputToken: "So11111111111111111111111111111111111111112",
                    outputToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                    amount: 0.1,
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Swapping 0.1 SOL for USDC using DAO...",
                    action: "TOKEN_SWAP_DAO",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "DAO Swap completed successfully! Transaction ID: ...",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
