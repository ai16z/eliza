import {
    UserWallet,
    UserSigner,
    ApiNetworkProvider,
    UserSecretKey,
    TransactionsFactoryConfig,
    TokenManagementTransactionsFactory,
    Address,
    TransactionComputer,
} from "@multiversx/sdk-core";
import {
    elizaLogger,
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    generateObject,
    composeContext,
    type Action,
} from "@ai16z/eliza";

export interface CreateTokenContent extends Content {
    tokenName: string;
    tokenTicker: string;
    decimals: string;
    amount: string;
}

function isTransferContent(
    runtime: IAgentRuntime,
    content: any
): content is CreateTokenContent {
    console.log("Content for create token", content);
    return (
        content.tokenName &&
        content.tokenTicker &&
        content.decimals &&
        content.amount
    );
}

const createTokenTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenName": "TEST",
    "tokenTicker": "TST",
    "amount: 100,
    "decimals": 18
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token creation:
- Token name
- Token ticker
- Amount
- Decimals

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "CREATE_TOKEN",
    similes: ["DEPLOY_TOKEN"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        console.log("Starting new token creation from user:", message.userId);
        //add custom validate logic here
        /*
            const adminIds = runtime.getSetting("ADMIN_USER_IDS")?.split(",") || [];
            //console.log("Admin IDs from settings:", adminIds);

            const isAdmin = adminIds.includes(message.userId);

            if (isAdmin) {
                //console.log(`Authorized transfer from user: ${message.userId}`);
                return true;
            }
            else
            {
                //console.log(`Unauthorized transfer attempt from user: ${message.userId}`);
                return false;
            }
            */
        return true;
    },
    description: "Create a new token.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting CREATE_TOKEN handler...");

        // Initialize or update state
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        // Compose transfer context
        const transferContext = composeContext({
            state,
            template: createTokenTemplate,
        });

        // Generate transfer content
        const content = await generateObject({
            runtime,
            context: transferContext,
            modelClass: ModelClass.SMALL,
        });

        // Validate transfer content
        if (!isTransferContent(runtime, content)) {
            console.error("Invalid content for TRANSFER_TOKEN action.");
            if (callback) {
                callback({
                    text: "Unable to process transfer request. Invalid content provided.",
                    content: { error: "Invalid transfer content" },
                });
            }
            return false;
        }

        try {
            const password = runtime.getSetting("MVX_WALLET_PASSWORD");
            const secretKeyHex = runtime.getSetting("MVX_WALLET_SECRET_KEY");

            const secretKey = UserSecretKey.fromString(secretKeyHex);

            const signer = new UserSigner(secretKey);
            const address = signer.getAddress();

            const apiNetworkProvider = new ApiNetworkProvider(
                "https://devnet-api.multiversx.com",
                { clientName: "eliza-mvx" }
            );

            const factoryConfig = new TransactionsFactoryConfig({
                chainID: "D",
            });
            const factory = new TokenManagementTransactionsFactory({
                config: factoryConfig,
            });

            const decimals = parseInt(content.decimals);
            const amount =
                Number(content.amount) * 10 ** Number(content.decimals);

            const account = await apiNetworkProvider.getAccount(address);

            const transaction = factory.createTransactionForIssuingFungible({
                sender: new Address(address),
                tokenName: content.tokenName,
                tokenTicker: content.tokenTicker.toUpperCase(),
                initialSupply: BigInt(amount),
                numDecimals: BigInt(decimals),
                canFreeze: false,
                canWipe: false,
                canPause: false,
                canChangeOwner: false,
                canUpgrade: false,
                canAddSpecialRoles: false,
            });

            const computer = new TransactionComputer();
            transaction.nonce = BigInt(account.nonce);
            const serializedTx = computer.computeBytesForSigning(transaction);
            transaction.signature = await signer.sign(serializedTx);

            const txHash =
                await apiNetworkProvider.sendTransaction(transaction);
            console.log("TxHash", txHash);
            return true;
        } catch (error) {
            console.error("Error during creating token:", error);
            if (callback) {
                callback({
                    text: `Error creating token: ${error.message}`,
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
                    text: "Create a token called TEST with ticker TST, 18 decimals and amount of 10000",
                    action: "CREATE_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Succesfully created token.",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
