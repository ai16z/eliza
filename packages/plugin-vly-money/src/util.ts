import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

// 转账函数
export const transferSOL = async (recipient: string, amount: number) => {
  const privateKey = [
    70, 202, 101, 68, 185, 142, 22, 191, 243, 125, 240, 0, 60, 191, 126, 18, 46,
    243, 33, 27, 36, 25, 235, 39, 130, 88, 175, 90, 143, 229, 148, 171, 45, 143,
    115, 242, 92, 159, 55, 209, 104, 125, 146, 29, 78, 186, 163, 48, 184, 133,
    100, 94, 49, 57, 193, 254, 91, 206, 59, 79, 42, 220, 131, 207,
  ];
  // 将私钥转换为 Uint8Array（取决于私钥格式，你可能需要进行不同的解码）
  const secretKey = new Uint8Array(privateKey);

  // 使用私钥创建一个 Keypair 对象
  const senderKeypair = Keypair.fromSecretKey(secretKey);

  // const url = "https://rpc.ankr.com/solana_devnet";
  const url =
    "https://skilled-muddy-water.solana-mainnet.quiknode.pro/a97f07b12a58eb78c883988b29b0ec46df918b40";

  const connection = new Connection(url, {
    commitment: "processed",
  });

  try {
    const recipientPublicKey = new PublicKey(recipient);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: recipientPublicKey,
        lamports: amount * 1e9, // Sol to lamports (1 SOL = 10^9 lamports)
      })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [
      senderKeypair,
    ]);

    console.log(`Transaction successful with signature: ${signature}`);
    return signature;
  } catch (error) {
    console.error("Error sending SOL:", error);
  }
};
