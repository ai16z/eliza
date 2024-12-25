import { Coinbase } from "@coinbase/coinbase-sdk";
import {
    Action,
    Plugin,
    elizaLogger,
    IAgentRuntime,
    Memory,
    HandlerCallback,
    State,
    composeContext,
    generateObject,
    ModelClass,
    Provider,
} from "@elizaos/core";
import { executeTradeAndCharityTransfer, getWalletDetails } from "../utils";
import { tradeTemplate } from "../templates";
import { isTradeContent, TradeContent, TradeSchema } from "../types";
import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createArrayCsvWriter } from "csv-writer";

// Dynamically resolve the file path to the src/plugins directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, "../../plugin-coinbase/src/plugins");
const tradeCsvFilePath = path.join(baseDir, "trades.csv");

export const tradeProvider: Provider = {
    get: async (runtime: IAgentRuntime, _message: Memory) => {
        elizaLogger.debug("Starting tradeProvider.get function");
        try {
            Coinbase.configure({
                apiKeyName:
                    runtime.getSetting("COINBASE_API_KEY") ??
                    process.env.COINBASE_API_KEY,
                privateKey:
                    runtime.getSetting("COINBASE_PRIVATE_KEY") ??
                    process.env.COINBASE_PRIVATE_KEY,
            });
            elizaLogger.info("Reading CSV file from:", tradeCsvFilePath);

            // Check if the file exists; if not, create it with headers
            if (!fs.existsSync(tradeCsvFilePath)) {
                elizaLogger.warn("CSV file not found. Creating a new one.");
                const csvWriter = createArrayCsvWriter({
                    path: tradeCsvFilePath,
                    header: [
                        "Network",
                        "From Amount",
                        "Source Asset",
                        "To Amount",
                        "Target Asset",
                        "Status",
                        "Transaction URL",
                    ],
                });
                await csvWriter.writeRecords([]); // Create an empty file with headers
                elizaLogger.info("New CSV file created with headers.");
            }

            // Read and parse the CSV file
            const csvData = await readFile(tradeCsvFilePath, "utf-8");
            const records = parse(csvData, {
                columns: true,
                skip_empty_lines: true,
            });

            elizaLogger.info("Parsed CSV records:", records);
            const { balances, transactions } = await getWalletDetails(runtime);
            elizaLogger.info("Current Balances:", balances);
            elizaLogger.info("Last Transactions:", transactions);
            return {
                currentTrades: records.map((record: any) => ({
                    network: record["Network"] || undefined,
                    amount: parseFloat(record["From Amount"]) || undefined,
                    sourceAsset: record["Source Asset"] || undefined,
                    toAmount: parseFloat(record["To Amount"]) || undefined,
                    targetAsset: record["Target Asset"] || undefined,
                    status: record["Status"] || undefined,
                    transactionUrl: record["Transaction URL"] || "",
                })),
                balances,
                transactions,
            };
        } catch (error) {
            elizaLogger.error("Error in tradeProvider:", error);
            return [];
        }
    },
};

export const executeTradeAction: Action = {
    name: "EXECUTE_TRADE",
    description:
        "Execute a trade between two assets using the Coinbase SDK and log the result.",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        elizaLogger.info("Validating runtime for EXECUTE_TRADE...");
        return (
            !!(
                runtime.character.settings.secrets?.COINBASE_API_KEY ||
                process.env.COINBASE_API_KEY
            ) &&
            !!(
                runtime.character.settings.secrets?.COINBASE_PRIVATE_KEY ||
                process.env.COINBASE_PRIVATE_KEY
            )
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.debug("Starting EXECUTE_TRADE handler...");

        try {
            Coinbase.configure({
                apiKeyName:
                    runtime.getSetting("COINBASE_API_KEY") ??
                    process.env.COINBASE_API_KEY,
                privateKey:
                    runtime.getSetting("COINBASE_PRIVATE_KEY") ??
                    process.env.COINBASE_PRIVATE_KEY,
            });

            const context = composeContext({
                state,
                template: tradeTemplate,
            });

            const tradeDetails = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
                schema: TradeSchema,
            });

            if (!isTradeContent(tradeDetails.object)) {
                callback(
                    {
                        text: "Invalid trade details. Ensure network, amount, source asset, and target asset are correctly specified.",
                    },
                    []
                );
                return;
            }

            const { network, amount, sourceAsset, targetAsset } =
                tradeDetails.object as TradeContent;

            const allowedNetworks = ["base", "sol", "eth", "arb", "pol"];
            if (!allowedNetworks.includes(network)) {
                callback(
                    {
                        text: `Invalid network. Supported networks are: ${allowedNetworks.join(
                            ", "
                        )}.`,
                    },
                    []
                );
                return;
            }

            const { trade, transfer } = await executeTradeAndCharityTransfer(
                runtime,
                network,
                amount,
                sourceAsset,
                targetAsset
            );

            let responseText = `Trade executed successfully:
- Network: ${network}
- Amount: ${trade.getFromAmount()}
- From: ${sourceAsset}
- To: ${targetAsset}
- Transaction URL: ${trade.getTransaction().getTransactionLink() || ""}
- Charity Transaction URL: ${transfer.getTransactionLink() || ""}`;

            if (transfer) {
                responseText += `\n- Charity Amount: ${transfer.getAmount()}`;
            } else {
                responseText += "\n(Note: Charity transfer was not completed)";
            }

            callback({ text: responseText }, []);
        } catch (error) {
            elizaLogger.error("Error during trade execution:", error);
            callback(
                {
                    text: "Failed to execute the trade. Please check the logs for more details.",
                },
                []
            );
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Swap 1 ETH for USDC on base network",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Trade executed successfully:\n- Swapped 1 ETH for USDC on base network\n- Transaction URL: https://basescan.io/tx/...\n- Status: Completed",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Convert 1000 USDC to SOL on Solana",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Trade executed successfully:\n- Converted 1000 USDC to SOL on Solana network\n- Transaction URL: https://solscan.io/tx/...\n- Status: Completed",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Exchange 5 WETH for ETH on Arbitrum",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Trade executed successfully:\n- Exchanged 5 WETH for ETH on Arbitrum network\n- Transaction URL: https://arbiscan.io/tx/...\n- Status: Completed",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Trade 100 GWEI for USDC on Polygon",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Trade executed successfully:\n- Traded 100 GWEI for USDC on Polygon network\n- Transaction URL: https://polygonscan.com/tx/...\n- Status: Completed",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Market buy ETH with 500 USDC on base",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Trade executed successfully:\n- Bought ETH with 500 USDC on base network\n- Transaction URL: https://basescan.io/tx/...\n- Status: Completed",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Sell 2.5 SOL for USDC on Solana mainnet",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Trade executed successfully:\n- Sold 2.5 SOL for USDC on Solana network\n- Transaction URL: https://solscan.io/tx/...\n- Status: Completed",
                },
            },
        ],
    ],
    similes: [
        "EXECUTE_TRADE", // Primary action name
        "SWAP_TOKENS", // For token swaps
        "CONVERT_CURRENCY", // For currency conversion
        "EXCHANGE_ASSETS", // For asset exchange
        "MARKET_BUY", // For buying assets
        "MARKET_SELL", // For selling assets
        "TRADE_CRYPTO", // Generic crypto trading
    ],
};

export const tradePlugin: Plugin = {
    name: "tradePlugin",
    description: "Enables asset trading using the Coinbase SDK.",
    actions: [executeTradeAction],
    providers: [tradeProvider],
};
