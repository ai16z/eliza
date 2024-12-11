import { Plugin } from "@ai16z/eliza";
import { clientProvider } from "./providers/client";
import { readContractAction } from "./actions/readContract";
import { writeContractAction } from "./actions/writeContract";
import { deployContractAction } from "./actions/deployContract";
import { getTransactionAction } from "./actions/getTransaction";
import { getCurrentNonceAction } from "./actions/getCurrentNonce";
import { waitForTransactionReceiptAction } from "./actions/waitForTransactionReceipt";
import { getContractSchemaAction } from "./actions/getContractSchema";

export const genLayerPlugin: Plugin = {
    name: "genlayer",
    description: "Plugin for interacting with GenLayer protocol",
    actions: [
        readContractAction,
        writeContractAction,
        deployContractAction,
        getTransactionAction,
        getCurrentNonceAction,
        waitForTransactionReceiptAction,
        getContractSchemaAction,
    ],
    evaluators: [],
    providers: [clientProvider],
};

export default genLayerPlugin;
