import {
    Coinbase,
    Wallet,
    Transfer,
    TimeoutError,
    Trade,
} from "@coinbase/coinbase-sdk";
import { keccak256, toHex, toBytes } from "viem";
import { getUserInfo } from "./resolver";
import { isAddress } from "viem";
import { generateOnRampURL } from "@coinbase/cbpay-js";
import { LocalStorage } from "./storage";
import { elizaLogger } from "@ai16z/eliza";

const appId = process.env.COINBASE_APP_ID;
const apiKeyName = process.env.COINBASE_API_KEY_NAME;
const privateKey = process.env.COINBASE_API_KEY_PRIVATE_KEY;

const coinbase =
    apiKeyName && privateKey
        ? new Coinbase({
              apiKeyName,
              privateKey,
          })
        : undefined;

elizaLogger.info("Coinbase initialized", coinbase !== undefined);
export type AgentWalletData = {
    id: string;
    wallet: any;
    address: string;
    agent_address: string;
    blockchain?: string;
    state?: string;
    key: string;
};

export interface AgentWallet {
    getWallet: (
        key: string,
        createIfNotFound?: boolean
    ) => Promise<AgentWalletData | undefined>;
    transfer: (
        fromAddress: string,
        toAddress: string,
        amount: number
    ) => Promise<any>;
    checkBalance: (
        key: string
    ) => Promise<{ address: string | undefined; balance: number }>;
    createWallet: (key: string) => Promise<AgentWalletData>;
    onRampURL: (amount: number, address: string) => Promise<string | undefined>;
}

export class WalletService implements AgentWallet {
    private walletStorage: LocalStorage;
    private cdpEncriptionKey: string;
    private senderAddress: string;

    constructor(sender: string) {
        this.walletStorage = new LocalStorage(".data/wallets");
        this.cdpEncriptionKey = (process.env.KEY as string).toLowerCase();
        this.senderAddress = sender.toLowerCase();
        elizaLogger.info(
            "WalletService initialized with sender",
            this.walletStorage,
            this.cdpEncriptionKey,
            this.senderAddress
        );
    }

    encrypt(data: any): string {
        if (typeof data === "string") {
            data = data.toLowerCase();
        }
        const dataString = JSON.stringify(data);
        const key = keccak256(toHex(this.cdpEncriptionKey));
        // Simple XOR encryption with the key
        const encrypted = Buffer.from(dataString).map(
            (byte, i) =>
                byte ^ parseInt(key.slice(2 + (i % 64), 4 + (i % 64)), 16)
        );
        return toHex(encrypted).toLowerCase();
    }

    decrypt(data: string): any | undefined {
        if (typeof data === "string") {
            data = data.toLowerCase();
        }
        const key = keccak256(toHex(this.cdpEncriptionKey));
        const encrypted = toBytes(data);
        const decrypted = encrypted.map(
            (byte, i) =>
                byte ^ parseInt(key.slice(2 + (i % 64), 4 + (i % 64)), 16)
        );
        return JSON.parse(Buffer.from(decrypted).toString());
    }
    async createWallet(key: string): Promise<AgentWalletData> {
        try {
            key = key.toLowerCase();
            elizaLogger.info(`Creating new wallet for key ${key}...`);
            const wallet = await Wallet.create({
                networkId: Coinbase.networks.BaseMainnet,
            });

            const data = wallet.export();
            const address = await wallet.getDefaultAddress();
            elizaLogger.info("New agent wallet created:", address.getId());

            const walletInfo = {
                data,
                agent_address: address.getId(),
                address: this.senderAddress,
                key,
            };

            await this.walletStorage.set(
                `wallet:${this.encrypt(key)}`,
                this.encrypt(walletInfo)
            );

            await Wallet.import(data);
            return {
                id: address.getId(),
                wallet: wallet,
                address: this.senderAddress,
                agent_address: address.getId(),
                key: key,
            };
        } catch (error) {
            console.error("Failed to create wallet:", error);
            throw new Error("Failed to create wallet");
        }
    }
    async getWallet(
        key: string,
        createIfNotFound: boolean = true
    ): Promise<AgentWalletData | undefined> {
        elizaLogger.info(
            "Wallet count:",
            await this.walletStorage.getWalletCount()
        );
        key = key.toLowerCase();
        const encryptedKey = `wallet:${this.encrypt(key)}`;
        const walletData = await this.walletStorage.get(encryptedKey);
        // If no wallet exists, create one
        if (!walletData) {
            elizaLogger.info("No wallet found for", key, encryptedKey);
            if (createIfNotFound) {
                const success = await this.createWallet(key);
                if (success) return success;
            }
            return undefined;
        }

        try {
            const decrypted = this.decrypt(walletData);
            const importedWallet = await Wallet.import(decrypted.data);
            return {
                id: importedWallet.getId() ?? "",
                wallet: importedWallet,
                agent_address: decrypted.agent_address,
                address: decrypted.address,
                key: decrypted.key,
            };
        } catch (error) {
            console.error("Failed to decrypt wallet data:", error);
            throw new Error("Invalid wallet access");
        }
    }

    async checkBalance(
        humanAddress: string
    ): Promise<{ address: string | undefined; balance: number }> {
        humanAddress = humanAddress.toLowerCase();
        const walletData = await this.getWallet(humanAddress);
        if (!walletData) return { address: undefined, balance: 0 };

        elizaLogger.info(`Retrieved wallet data for ${humanAddress}`);
        const balance = await walletData.wallet.getBalance(
            Coinbase.assets.Usdc
        );

        return {
            address: walletData.agent_address,
            balance: Number(balance),
        };
    }
    async onRampURL(amount: number, address: string) {
        const onRampURL = generateOnRampURL({
            appId: appId,
            presetCryptoAmount: Number(amount),
            addresses: {
                [address]: ["base"],
            },
            assets: ["USDC"],
        });
        return onRampURL;
    }
    async transfer(
        fromAddress: string,
        toAddress: string,
        amount: number
    ): Promise<Transfer | undefined> {
        fromAddress = fromAddress.toLowerCase();
        toAddress = toAddress.toLowerCase();
        const from = await this.getWallet(fromAddress);
        if (!from) return undefined;
        if (!Number(amount)) return undefined;

        elizaLogger.info(`Retrieved wallet data for ${fromAddress}`);
        const balance = await from.wallet.getBalance(Coinbase.assets.Usdc);
        if (Number(balance) < amount) {
            return undefined;
        }
        if (!isAddress(toAddress) && !toAddress.includes(":")) {
            const user = await getUserInfo(toAddress);
            if (!user) {
                return undefined;
            }
            elizaLogger.info("resolved toAddress", toAddress, user?.address);

            toAddress = user.address as string;
        }
        const to = await this.getWallet(toAddress, false);
        const toWallet = to?.agent_address ?? toAddress;
        if (toWallet.includes(":")) {
            elizaLogger.info("Failed accessing the wallet");
            return undefined;
        }
        try {
            elizaLogger.info("Transferring", amount, fromAddress, toWallet);
            const transfer = await from.wallet.createTransfer({
                amount,
                assetId: Coinbase.assets.Usdc,
                destination: toWallet as string,
                gasless: true,
            });
            try {
                await transfer.wait();
            } catch (err) {
                if (err instanceof TimeoutError) {
                    elizaLogger.info("Waiting for transfer timed out");
                } else {
                    console.error(
                        "Error while waiting for transfer to complete: ",
                        err
                    );
                }
            }

            return transfer;
        } catch (error) {
            console.error("Transfer failed:", error);
            throw error;
        }
    }
    async swap(
        address: string,
        fromAssetId: string,
        toAssetId: string,
        amount: number
    ): Promise<Trade | undefined> {
        address = address.toLowerCase();
        const walletData = await this.getWallet(address);
        if (!walletData) return undefined;
        elizaLogger.info(`Retrieved wallet data for ${address}`);

        elizaLogger.info(
            `Initiating swap from ${fromAssetId} to ${toAssetId} for amount: ${amount}`
        );
        const trade = await walletData.wallet.createTrade({
            amount,
            fromAssetId,
            toAssetId,
        });

        try {
            await trade.wait();
        } catch (err) {
            if (err instanceof TimeoutError) {
                elizaLogger.info("Waiting for trade timed out");
            } else {
                console.error(
                    "Error while waiting for trade to complete: ",
                    err
                );
            }
        }

        return trade;
    }

    async deleteWallet(key: string): Promise<boolean> {
        key = key.toLowerCase();
        elizaLogger.info(`Deleting wallet for key ${key}`);
        const encryptedKey = this.encrypt(key);
        await this.walletStorage.del(`wallet:${encryptedKey}`);
        elizaLogger.info(`Wallet deleted for key ${key}`);
        return true;
    }
}
