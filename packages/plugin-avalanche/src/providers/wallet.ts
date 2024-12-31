import {
    IAgentRuntime,
    Memory,
    Provider,
    State,
    elizaLogger,
} from "@elizaos/core";
import { formatUnits } from "viem";
import { getAccount, getDecimals, getTokenBalance } from "../utils";
import { STRATEGY_ADDRESSES, TOKEN_ADDRESSES } from "../utils/constants";

const walletProvider: Provider = {
    get: async (runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        elizaLogger.debug("walletProvider::get");
        const privateKey = runtime.getSetting("AVALANCHE_PRIVATE_KEY");
        if (!privateKey) {
            throw new Error(
                "AVALANCHE_PRIVATE_KEY not found in environment variables"
            );
        }

        const account = getAccount(runtime);

        let output = `# Wallet Balances\n\n`;
        output += `## Wallet Address\n\n\`${account.address}\`\n\n`;

        output += `## Latest Token Balances\n\n`;
        for (const [token, address] of Object.entries(TOKEN_ADDRESSES)) {
            const decimals = await getDecimals(runtime, address);
            const balance = await getTokenBalance(
                runtime,
                address,
                account.address
            );
            output += `${token}: ${formatUnits(balance, decimals)}\n`;
        }
        output += `Note: These balances can be used at any time.\n\n`;

        output += `## Balances in Yield Strategies\n\n`;
        for (const [strategy, address] of Object.entries(STRATEGY_ADDRESSES)) {
            const balance = await getTokenBalance(
                runtime,
                address,
                account.address
            );
            const decimals = await getDecimals(runtime, address);
            output += `${strategy}: ${formatUnits(balance, decimals)}\n`;
        }
        output += `Note: These balances must be withdrawn from the strategy before they can be used.\n\n`;

        elizaLogger.debug("walletProvider::get output:", output);
        return output;
    },
};

export { walletProvider };
