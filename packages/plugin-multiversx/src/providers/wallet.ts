import { elizaLogger } from "@ai16z/eliza";
import {
    UserSigner,
    Address,
    TransactionComputer,
    ApiNetworkProvider,
    UserSecretKey,
    TokenTransfer,
    TransferTransactionsFactory,
    TransactionsFactoryConfig,
    Token,
    Transaction,
    TokenManagementTransactionsFactory,
} from "@multiversx/sdk-core";
import { denominateAmount } from "../utils/amount";

// Network configuration object for different environments (mainnet, devnet, testnet)
const MVX_NETWORK_CONFIG = {
    mainnet: {
        chainID: "1", // Mainnet chain ID
        apiURL: "https://api.multiversx.com", // Mainnet API URL
        explorerURL: "https://explorer.multiversx.com",
    },
    devnet: {
        chainID: "D", // Devnet chain ID
        apiURL: "https://devnet-api.multiversx.com", // Devnet API URL,
        explorerURL: "https://devnet-explorer.multiversx.com",
    },
    testnet: {
        chainID: "T", // Testnet chain ID
        apiURL: "https://testnet-api.multiversx.com", // Testnet API URL
        explorerURL: "https://testnet-explorer.multiversx.com",
    },
};

// WalletProvider class handles wallet-related operations, such as signing transactions, retrieving balance, and sending tokens
export class WalletProvider {
    private signer: UserSigner; // Handles cryptographic signing
    private apiNetworkProvider: ApiNetworkProvider; // Interacts with the MultiversX network
    private chainID: string; // Current network chain ID
    private explorerURL: string; // Current network explorer URL

    /**
     * Constructor to initialize WalletProvider with a private key and network configuration
     * @param privateKey - User's private key for signing transactions
     * @param network - Target network (mainnet, devnet, or testnet)
     */
    constructor(privateKey: string, network: string) {
        if (!MVX_NETWORK_CONFIG[network]) {
            throw new Error(`Unsupported network: ${network}`); // Validate network
        }

        const networkConfig = MVX_NETWORK_CONFIG[network];
        this.chainID = networkConfig.chainID;
        this.explorerURL = networkConfig.explorerURL;

        // Initialize the signer with the user's private key
        const secretKey = UserSecretKey.fromString(privateKey);
        this.signer = new UserSigner(secretKey);

        // Set up the network provider for API interactions
        this.apiNetworkProvider = new ApiNetworkProvider(networkConfig.apiURL, {
            clientName: "eliza-mvx",
        });
    }

    /**
     * Retrieve the wallet address derived from the private key
     * @returns Address object
     */
    public getAddress(): Address {
        return this.signer.getAddress();
    }

    /**
     * Fetch the wallet's current EGLD balance
     * @returns Promise resolving to the wallet's balance as a string
     */
    public async getBalance(): Promise<string> {
        const address = new Address(this.getAddress());
        const account = await this.apiNetworkProvider.getAccount(address);
        return account.balance.toString(); // Return balance as a string
    }

    /**
     * Sign a transaction using the wallet's private key
     * @param transaction - The transaction object to sign
     * @returns The transaction signature as a string
     */
    public async signTransaction(transaction: Transaction) {
        const computer = new TransactionComputer();
        const serializedTx = computer.computeBytesForSigning(transaction); // Prepare transaction for signing
        const signature = await this.signer.sign(serializedTx); // Sign the transaction
        return signature;
    }

    /**
     * Send EGLD tokens to another wallet
     * @param receiverAddress - Recipient's wallet address
     * @param amount - Amount of EGLD to send
     * @returns Transaction hash as a string
     */
    public async sendEGLD({
        receiverAddress,
        amount,
    }: {
        receiverAddress: string;
        amount: string;
    }): Promise<string> {
        try {
            const receiver = new Address(receiverAddress);
            const value = denominateAmount({ amount, decimals: 18 }); // Convert amount to the smallest unit
            const senderAddress = this.getAddress();

            // Prepare the transaction factory with the current chain ID
            const factoryConfig = new TransactionsFactoryConfig({
                chainID: this.chainID,
            });
            const factory = new TransferTransactionsFactory({
                config: factoryConfig,
            });

            // Create a native EGLD transfer transaction
            const transaction = factory.createTransactionForNativeTokenTransfer(
                {
                    sender: this.getAddress(),
                    receiver: receiver,
                    nativeAmount: BigInt(value),
                }
            );

            // Get the sender's account details to set the nonce
            const account =
                await this.apiNetworkProvider.getAccount(senderAddress);
            transaction.nonce = BigInt(account.nonce);

            // Sign the transaction
            const signature = await this.signTransaction(transaction);
            transaction.signature = signature;

            // Broadcast the transaction to the network
            const txHash =
                await this.apiNetworkProvider.sendTransaction(transaction);

            elizaLogger.log(`TxHash: ${txHash}`); // Log transaction hash
            elizaLogger.log(
                `Transaction URL: ${this.explorerURL}/transactions/${txHash}`
            ); // View Transaction
            return txHash;
        } catch (error) {
            console.error("Error sending EGLD transaction:", error);
            throw new Error(
                `Failed to send EGLD: ${error.message || "Unknown error"}`
            );
        }
    }

    /**
     * Send ESDT (eStandard Digital Token) tokens to another wallet
     * @param receiverAddress - Recipient's wallet address
     * @param amount - Amount of ESDT to send
     * @param identifier - ESDT token identifier (e.g., PEPE-3eca7c)
     * @returns Transaction hash as a string
     */
    public async sendESDT({
        receiverAddress,
        amount,
        identifier,
    }: {
        receiverAddress: string;
        amount: string;
        identifier: string;
    }): Promise<string> {
        try {
            const address = this.getAddress();

            // Set up transaction factory for ESDT transfers
            const config = new TransactionsFactoryConfig({
                chainID: this.chainID,
            });
            const factory = new TransferTransactionsFactory({ config });

            // Retrieve token details to determine the token's decimals
            const token =
                await this.apiNetworkProvider.getFungibleTokenOfAccount(
                    address,
                    identifier
                );

            // Convert amount to the token's smallest unit
            const value = denominateAmount({
                amount,
                decimals: token.rawResponse.decimals,
            });

            // Create an ESDT transfer transaction
            const transaction = factory.createTransactionForESDTTokenTransfer({
                sender: this.getAddress(),
                receiver: new Address(receiverAddress),
                tokenTransfers: [
                    new TokenTransfer({
                        token: new Token({ identifier }),
                        amount: BigInt(value),
                    }),
                ],
            });

            // Set the transaction nonce
            const account = await this.apiNetworkProvider.getAccount(address);
            transaction.nonce = BigInt(account.nonce);

            // Sign and broadcast the transaction
            const signature = await this.signTransaction(transaction);
            transaction.signature = signature;
            const txHash =
                await this.apiNetworkProvider.sendTransaction(transaction);

            elizaLogger.log(`TxHash: ${txHash}`); // Log transaction hash
            elizaLogger.log(
                `Transaction URL: ${this.explorerURL}/transactions/${txHash}`
            ); // View Transaction
            return txHash;
        } catch (error) {
            console.error("Error sending ESDT transaction:", error);
            throw new Error(
                `Failed to send ESDT: ${error.message || "Unknown error"}`
            );
        }
    }

    /**
     * Create a new eStandard Digital Token (ESDT).
     * @param tokenName - The name of the token to be created.
     * @param tokenTicker - The ticker symbol for the token.
     * @param amount - The initial supply of the token.
     * @param decimals - The number of decimal places for the token.
     * @returns The transaction hash of the created ESDT.
     */
    public async createESDT({
        tokenName,
        tokenTicker,
        amount,
        decimals,
    }: {
        tokenName: string;
        tokenTicker: string;
        amount: string;
        decimals: number;
    }): Promise<string> {
        try {
            const address = this.getAddress(); // Retrieve the sender's address

            const factoryConfig = new TransactionsFactoryConfig({
                chainID: this.chainID, // Set the chain ID for the transaction factory
            });
            const factory = new TokenManagementTransactionsFactory({
                config: factoryConfig, // Initialize the factory with the configuration
            });

            const totalSupply = denominateAmount({ amount, decimals });

            // Create a transaction for issuing a fungible token
            const transaction = factory.createTransactionForIssuingFungible({
                sender: new Address(address), // Specify the sender's address
                tokenName, // Name of the token
                tokenTicker: tokenTicker.toUpperCase(), // Token ticker in uppercase
                initialSupply: BigInt(totalSupply), // Initial supply as a BigInt
                numDecimals: BigInt(decimals), // Number of decimals as a BigInt
                canFreeze: false, // Token cannot be frozen
                canWipe: false, // Token cannot be wiped
                canPause: false, // Token cannot be paused
                canChangeOwner: true, // Ownership can be changed
                canUpgrade: true, // Token can be upgraded
                canAddSpecialRoles: true, // Special roles can be added
            });

            // Fetch the account details to set the nonce
            const account = await this.apiNetworkProvider.getAccount(address);
            transaction.nonce = BigInt(account.nonce); // Set the nonce for the transaction

            const signature = await this.signTransaction(transaction); // Sign the transaction
            transaction.signature = signature; // Attach the signature to the transaction

            // Send the transaction to the network and get the transaction hash
            const txHash =
                await this.apiNetworkProvider.sendTransaction(transaction);

            elizaLogger.log(`TxHash: ${txHash}`); // Log the transaction hash
            elizaLogger.log(
                `Transaction URL: ${this.explorerURL}/transactions/${txHash}`
            ); // View Transaction

            return txHash; // Return the transaction hash
        } catch (error) {
            console.error("Error creating ESDT:", error);
            throw new Error(
                `Failed to create ESDT: ${error.message || "Unknown error"}`
            ); // Throw an error if creation fails
        }
    }
}
