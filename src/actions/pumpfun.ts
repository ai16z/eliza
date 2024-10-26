import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  DEFAULT_DECIMALS,
  PumpFunSDK,
  CreateTokenMetadata,
  PriorityFee,
} from "pumpdotfun-sdk";
import { AnchorProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

import settings from "../core/settings";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import {
  ActionExample,
  IAgentRuntime,
  Memory,
  Content,
  type Action,
} from "../core/types.ts";

export interface CreateAndBuyContent extends Content {
  deployerPrivateKey: string;
  tokenMetadata: CreateTokenMetadata;
  buyAmountSol: string | number;
  priorityFee: {
    unitLimit: number;
    unitPrice: number;
  };
  allowOffCurve: boolean;
}

export function isCreateAndBuyContent(
  content: any
): content is CreateAndBuyContent {
  return (
    typeof content.deployerPrivateKey === "string" &&
    typeof content.tokenMetadata === "object" &&
    content.tokenMetadata !== null &&
    (typeof content.buyAmountSol === "string" ||
      typeof content.buyAmountSol === "number") &&
    typeof content.priorityFee === "object" &&
    content.priorityFee !== null &&
    typeof content.priorityFee.unitLimit === "number" &&
    typeof content.priorityFee.unitPrice === "number" &&
    typeof content.allowOffCurve === "boolean"
  );
}

const privateKey = settings.WALLET_PRIVATE_KEY!;
const wallet = new NodeWallet(
  Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey)))
);
const connection = new Connection(settings.RPC_URL!);
const provider = new AnchorProvider(connection, wallet, {
  commitment: "finalized",
});
const sdk = new PumpFunSDK(provider);
const slippage = settings.SLIPPAGE!;

export const createAndBuyToken = async ({
  deployer,
  mint,
  tokenMetadata,
  buyAmountSol,
  priorityFee,
  allowOffCurve,
  commitment = "finalized",
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
  if (createResults.success) {
    console.log("Success:", `https://pump.fun/${mint.publicKey.toBase58()}`);
    let ata = getAssociatedTokenAddressSync(
      mint.publicKey,
      deployer.publicKey,
      allowOffCurve
    );
    const balance = await connection.getTokenAccountBalance(ata, "processed");
    const amount = balance.value.uiAmount;
    if (amount === null) {
      console.log(`${deployer.publicKey.toBase58()}:`, "No Account Found");
    } else {
      console.log(`${deployer.publicKey.toBase58()}:`, amount);
    }
  } else {
    console.log("Create and Buy failed");
  }
};

export const buyToken = async ({
  sdk,
  buyer,
  mint,
  amount,
  priorityFee,
  allowOffCurve,
}: {
  sdk: PumpFunSDK;
  buyer: Keypair;
  mint: PublicKey;
  amount: bigint;
  priorityFee: PriorityFee;
  allowOffCurve: boolean;
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
    let ata = getAssociatedTokenAddressSync(
      mint,
      buyer.publicKey,
      allowOffCurve
    );
    const balance = await connection.getTokenAccountBalance(ata, "processed");
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
}: {
  sdk: PumpFunSDK;
  seller: Keypair;
  mint: PublicKey;
  amount: bigint;
  priorityFee: PriorityFee;
  allowOffCurve: boolean;
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
    let ata = getAssociatedTokenAddressSync(
      mint,
      seller.publicKey,
      allowOffCurve
    );
    const balance = await connection.getTokenAccountBalance(ata, "processed");
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

const promptConfirmation = async (): Promise<boolean> => {
  if (typeof window !== "undefined" && typeof window.confirm === "function") {
    return window.confirm("Confirm the creation and purchase of the token?");
  }
  return true;
};

export default {
  name: "CREATE_AND_BUY_TOKEN",
  similes: ["CREATE_AND_PURCHASE_TOKEN", "DEPLOY_AND_BUY_TOKEN"],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return isCreateAndBuyContent(message.content);
  },
  description:
    "Create a new token and buy a specified amount using SOL. Requires deployer private key, token metadata, buy amount in SOL, priority fee, and allowOffCurve flag.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory
  ): Promise<boolean> => {
    const content = message.content;
    if (!isCreateAndBuyContent(content)) {
      console.error("Invalid content for CREATE_AND_BUY_TOKEN action.");
      return false;
    }
    const {
      deployerPrivateKey,
      tokenMetadata,
      buyAmountSol,
      priorityFee,
      allowOffCurve,
    } = content;

    try {
      const deployerKeypair = Keypair.fromSecretKey(
        Uint8Array.from(Buffer.from(deployerPrivateKey, "base64"))
      );

      const mintKeypair = Keypair.generate();

      const createAndBuyConfirmation = await promptConfirmation();
      if (!createAndBuyConfirmation) {
        console.log("Create and buy token canceled by user");
        return false;
      }

      // Execute Create and Buy
      await createAndBuyToken({
        deployer: deployerKeypair,
        mint: mintKeypair,
        tokenMetadata: tokenMetadata as CreateTokenMetadata,
        buyAmountSol: BigInt(buyAmountSol),
        priorityFee: priorityFee as PriorityFee,
        allowOffCurve: allowOffCurve as boolean,
      });

      console.log(
        `Token created and purchased successfully! View at: https://pump.fun/${mintKeypair.publicKey.toBase58()}`
      );
      return true;
    } catch (error) {
      console.error("Error during create and buy token:", error);
      return false;
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          deployerPrivateKey: "Base64EncodedPrivateKey",
          tokenMetadata: {
            name: "MyToken",
            symbol: "MTK",
            description: "My first token",
            file: "Base64EncodedFile", // blob file of the image
            decimals: DEFAULT_DECIMALS,
          },
          buyAmountSol: "1000000000", // 1 SOL in lamports
          priorityFee: 1000,
          allowOffCurve: false,
        },
      },
      {
        user: "{{user2}}",
        content: {
          text: "Creating and buying 1 SOL worth of MyToken...",
          action: "CREATE_AND_BUY_TOKEN",
        },
      },
      {
        user: "{{user2}}",
        content: {
          text: "Token created and purchased successfully! View at: https://pump.fun/MintPublicKey",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
