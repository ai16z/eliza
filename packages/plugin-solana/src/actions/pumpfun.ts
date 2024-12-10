import { AnchorProvider } from "@coral-xyz/anchor";
import { Wallet } from "@coral-xyz/anchor";
import { generateImage } from "@ai16z/eliza";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { CreateTokenMetadata, PriorityFee, PumpFunSDK } from "pumpdotfun-sdk";

import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
    settings,
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    generateObjectDEPRECATED,
    composeContext,
    type Action,
} from "@ai16z/eliza";

import { walletProvider } from "../providers/wallet.ts";

export interface CreateAndBuyContent extends Content {
    tokenMetadata: {
        name: string;
        symbol: string;
        description: string;
        image_description: string;
    };
    buyAmountSol: string | number;
}

export function isCreateAndBuyContent(
    runtime: IAgentRuntime,
    content: any
): content is CreateAndBuyContent {
    console.log("Content for create & buy", content);
    return (
        typeof content.tokenMetadata === "object" &&
        content.tokenMetadata !== null &&
        typeof content.tokenMetadata.name === "string" &&
        typeof content.tokenMetadata.symbol === "string" &&
        typeof content.tokenMetadata.description === "string" &&
        typeof content.tokenMetadata.image_description === "string" &&
        (typeof content.buyAmountSol === "string" ||
            typeof content.buyAmountSol === "number")
    );
}

export const createAndBuyToken = async ({
    deployer,
    mint,
    tokenMetadata,
    buyAmountSol,
    priorityFee,
    allowOffCurve,
    commitment = "finalized",
    sdk,
    connection,
    slippage,
}: {
    deployer: Keypair;
    mint: Keypair;
    tokenMetadata: CreateTokenMetadata;
    buyAmountSol: bigint;
    priorityFee: PriorityFee;
    allowOffCurve: boolean;
    commitment?:
        | "processed"
        | "confirmed"
        | "finalized"
        | "recent"
        | "single"
        | "singleGossip"
        | "root"
        | "max";
    sdk: PumpFunSDK;
    connection: Connection;
    slippage: string;
}) => {
    const createResults = await sdk.createAndBuy(
        deployer,
        mint,
        tokenMetadata,
        buyAmountSol,
        BigInt(slippage),
        priorityFee,
        commitment
    );

    console.log("Create Results: ", createResults);

    if (createResults.success) {
        console.log(
            "Success:",
            `https://pump.fun/${mint.publicKey.toBase58()}`
        );
        const ata = getAssociatedTokenAddressSync(
            mint.publicKey,
            deployer.publicKey,
            allowOffCurve
        );
        const balance = await connection.getTokenAccountBalance(
            ata,
            "processed"
        );
        const amount = balance.value.uiAmount;
        if (amount === null) {
            console.log(
                `${deployer.publicKey.toBase58()}:`,
                "No Account Found"
            );
        } else {
            console.log(`${deployer.publicKey.toBase58()}:`, amount);
        }

        return {
            success: true,
            ca: mint.publicKey.toBase58(),
            creator: deployer.publicKey.toBase58(),
        };
    } else {
        console.log("Create and Buy failed");
        return {
            success: false,
            ca: mint.publicKey.toBase58(),
            error: createResults.error || "Transaction failed",
        };
    }
};

export const buyToken = async ({
    sdk,
    buyer,
    mint,
    amount,
    priorityFee,
    allowOffCurve,
    slippage,
    connection,
}: {
    sdk: PumpFunSDK;
    buyer: Keypair;
    mint: PublicKey;
    amount: bigint;
    priorityFee: PriorityFee;
    allowOffCurve: boolean;
    slippage: string;
    connection: Connection;
}) => {
    const buyResults = await sdk.buy(
        buyer,
        mint,
        amount,
        BigInt(slippage),
        priorityFee
    );
    if (buyResults.success) {
        console.log("Success:", `https://pump.fun/${mint.toBase58()}`);
        const ata = getAssociatedTokenAddressSync(
            mint,
            buyer.publicKey,
            allowOffCurve
        );
        const balance = await connection.getTokenAccountBalance(
            ata,
            "processed"
        );
        const amount = balance.value.uiAmount;
        if (amount === null) {
            console.log(`${buyer.publicKey.toBase58()}:`, "No Account Found");
        } else {
            console.log(`${buyer.publicKey.toBase58()}:`, amount);
        }
    } else {
        console.log("Buy failed");
    }
};

export const sellToken = async ({
    sdk,
    seller,
    mint,
    amount,
    priorityFee,
    allowOffCurve,
    slippage,
    connection,
}: {
    sdk: PumpFunSDK;
    seller: Keypair;
    mint: PublicKey;
    amount: bigint;
    priorityFee: PriorityFee;
    allowOffCurve: boolean;
    slippage: string;
    connection: Connection;
}) => {
    const sellResults = await sdk.sell(
        seller,
        mint,
        amount,
        BigInt(slippage),
        priorityFee
    );
    if (sellResults.success) {
        console.log("Success:", `https://pump.fun/${mint.toBase58()}`);
        const ata = getAssociatedTokenAddressSync(
            mint,
            seller.publicKey,
            allowOffCurve
        );
        const balance = await connection.getTokenAccountBalance(
            ata,
            "processed"
        );
        const amount = balance.value.uiAmount;
        if (amount === null) {
            console.log(`${seller.publicKey.toBase58()}:`, "No Account Found");
        } else {
            console.log(`${seller.publicKey.toBase58()}:`, amount);
        }
    } else {
        console.log("Sell failed");
    }
};

// previous logic:
// if (typeof window !== "undefined" && typeof window.confirm === "function") {
//     return window.confirm(
//         "Confirm the creation and purchase of the token?"
//     );
// }
// return true;
const promptConfirmation = async (): Promise<boolean> => {
    return true;
};

// Save the base64 data to a file
import * as fs from "fs";
import * as path from "path";
import { getWalletKey } from "../keypairUtils.ts";

const pumpfunTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenMetadata": {
        "name": "Test Token",
        "symbol": "TEST",
        "description": "A test token",
        "image_description": "create an image of a rabbit"
    },
    "buyAmountSol": "0.00069"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract or generate (come up with if not included) the following information about the requested token creation:
- Token name
- Token symbol
- Token description
- Token image description
- Amount of SOL to buy

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "CREATE_AND_BUY_TOKEN",
    similes: ["CREATE_AND_PURCHASE_TOKEN", "DEPLOY_AND_BUY_TOKEN"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true; //return isCreateAndBuyContent(runtime, message.content);
    },
    description:
        "Create a new token and buy a specified amount using SOL. Requires deployer private key, token metadata, buy amount in SOL, priority fee, and allowOffCurve flag.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        console.log("Starting CREATE_AND_BUY_TOKEN handler...");

        // Compose state if not provided
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        // Get wallet info for context
        const walletInfo = await walletProvider.get(runtime, message, state);
        state.walletInfo = walletInfo;

        // Generate structured content from natural language
        const pumpContext = composeContext({
            state,
            template: pumpfunTemplate,
        });

        const content = await generateObjectDEPRECATED({
            runtime,
            context: pumpContext,
            modelClass: ModelClass.LARGE,
        });

        // Validate the generated content
        if (!isCreateAndBuyContent(runtime, content)) {
            console.error("Invalid content for CREATE_AND_BUY_TOKEN action.");
            return false;
        }

        const { tokenMetadata, buyAmountSol } = content;
        /*
            // Generate image if tokenMetadata.file is empty or invalid
            if (!tokenMetadata.file || tokenMetadata.file.length < 100) {  // Basic validation
                try {
                    const imageResult = await generateImage({
                        prompt: `logo for ${tokenMetadata.name} (${tokenMetadata.symbol}) token - ${tokenMetadata.description}`,
                        width: 512,
                        height: 512,
                        count: 1
                    }, runtime);

                    if (imageResult.success && imageResult.data && imageResult.data.length > 0) {
                        // Remove the "data:image/png;base64," prefix if present
                        tokenMetadata.file = imageResult.data[0].replace(/^data:image\/[a-z]+;base64,/, '');
                    } else {
                        console.error("Failed to generate image:", imageResult.error);
                        return false;
                    }
                } catch (error) {
                    console.error("Error generating image:", error);
                    return false;
                }
            } */

        const imageResult = await generateImage(
            {
                prompt: `logo for ${tokenMetadata.name} (${tokenMetadata.symbol}) token - ${tokenMetadata.description}`,
                width: 256,
                height: 256,
                count: 1,
            },
            runtime
        );

        tokenMetadata.image_description = imageResult.data[0].replace(
            /^data:image\/[a-z]+;base64,/,
            ""
        );

        // Convert base64 string to Blob
        const base64Data = tokenMetadata.image_description;
        const outputPath = path.join(
            process.cwd(),
            `generated_image_${Date.now()}.txt`
        );
        fs.writeFileSync(outputPath, base64Data);
        console.log(`Base64 data saved to: ${outputPath}`);

        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });

        // Add the default decimals and convert file to Blob
        const fullTokenMetadata: CreateTokenMetadata = {
            name: tokenMetadata.name,
            symbol: tokenMetadata.symbol,
            description: tokenMetadata.description,
            file: blob,
        };

        // Default priority fee for high network load
        const priorityFee = {
            unitLimit: 100_000_000,
            unitPrice: 100_000,
        };
        const slippage = "2000";
        try {
            // Get private key from settings and create deployer keypair
            const { keypair: deployerKeypair } = await getWalletKey(
                runtime,
                true
            );

            // Generate new mint keypair
            const mintKeypair = Keypair.generate();
            console.log(
                `Generated mint address: ${mintKeypair.publicKey.toBase58()}`
            );

            // Setup connection and SDK
            const connection = new Connection(settings.RPC_URL!, {
                commitment: "confirmed",
                confirmTransactionInitialTimeout: 500000, // 120 seconds
                wsEndpoint: settings.RPC_URL!.replace("https", "wss"),
            });

            const wallet = new Wallet(deployerKeypair);
            const provider = new AnchorProvider(connection, wallet, {
                commitment: "finalized",
            });
            const sdk = new PumpFunSDK(provider);
            // const slippage = runtime.getSetting("SLIPPAGE");

            const createAndBuyConfirmation = await promptConfirmation();
            if (!createAndBuyConfirmation) {
                console.log("Create and buy token canceled by user");
                return false;
            }

            // Convert SOL to lamports (1 SOL = 1_000_000_000 lamports)
            const lamports = Math.floor(Number(buyAmountSol) * 1_000_000_000);

            console.log("Executing create and buy transaction...");
            const result = await createAndBuyToken({
                deployer: deployerKeypair,
                mint: mintKeypair,
                tokenMetadata: fullTokenMetadata,
                buyAmountSol: BigInt(lamports),
                priorityFee,
                allowOffCurve: false,
                sdk,
                connection,
                slippage,
            });

            if (callback) {
                if (result.success) {
                    callback({
                        text: `Token ${tokenMetadata.name} (${tokenMetadata.symbol}) created successfully!\nContract Address: ${result.ca}\nCreator: ${result.creator}\nView at: https://pump.fun/${result.ca}`,
                        content: {
                            tokenInfo: {
                                symbol: tokenMetadata.symbol,
                                address: result.ca,
                                creator: result.creator,
                                name: tokenMetadata.name,
                                description: tokenMetadata.description,
                                timestamp: Date.now(),
                            },
                        },
                    });
                } else {
                    callback({
                        text: `Failed to create token: ${result.error}\nAttempted mint address: ${result.ca}`,
                        content: {
                            error: result.error,
                            mintAddress: result.ca,
                        },
                    });
                }
            }
            //await trustScoreDb.addToken(tokenInfo);
            /*
                // Update runtime state
                await runtime.updateState({
                    ...state,
                    lastCreatedToken: tokenInfo
                });
                */
            // Log success message with token view URL
            const successMessage = `Token created and purchased successfully! View at: https://pump.fun/${mintKeypair.publicKey.toBase58()}`;
            console.log(successMessage);
            return result.success;
        } catch (error) {
            if (callback) {
                callback({
                    text: `Error during token creation: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a new token called GLITCHIZA with symbol GLITCHIZA and generate a description about it. Also come up with a description for it to use for image generation .buy 0.00069 SOL worth.",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Token GLITCHIZA (GLITCHIZA) created successfully!\nContract Address: 3kD5DN4bbA3nykb1abjS66VF7cYZkKdirX8bZ6ShJjBB\nCreator: 9jW8FPr6BSSsemWPV22UUCzSqkVdTp6HTyPqeqyuBbCa\nView at: https://pump.fun/EugPwuZ8oUMWsYHeBGERWvELfLGFmA1taDtmY8uMeX6r",
                    action: "CREATE_AND_BUY_TOKEN",
                    content: {
                        tokenInfo: {
                            symbol: "GLITCHIZA",
                            address:
                                "EugPwuZ8oUMWsYHeBGERWvELfLGFmA1taDtmY8uMeX6r",
                            creator:
                                "9jW8FPr6BSSsemWPV22UUCzSqkVdTp6HTyPqeqyuBbCa",
                            name: "GLITCHIZA",
                            description: "A GLITCHIZA token",
                        },
                    },
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
