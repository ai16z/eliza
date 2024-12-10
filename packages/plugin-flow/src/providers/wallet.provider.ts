import {
    elizaLogger,
    IAgentRuntime,
    Memory,
    Provider,
    State,
} from "@ai16z/eliza";
import NodeCache from "node-cache";
import * as fcl from "@onflow/fcl";
import type { CompositeSignature, Account } from "@onflow/typedefs";
import type { FlowConnector } from "./utils/flow.connector";
import { IFlowScriptExecutor, IFlowSigner } from "../types";
import { getFlowConnectorInstance } from "./connector.provider";
import PureSigner from "./utils/pure.signer";
import Exception from "../types/exception";
import * as queries from "../queries";

/**
 * Flow wallet Provider
 */
export class FlowWalletProvider implements IFlowSigner, IFlowScriptExecutor {
    runtime: IAgentRuntime;
    private readonly privateKeyHex?: string;
    public readonly address: string;
    // Runtime data
    private account: Account | null = null;
    public maxKeyIndex = 0;

    constructor(
        runtime: IAgentRuntime,
        private readonly connector: FlowConnector,
        private readonly cache: NodeCache = new NodeCache({ stdTTL: 300 }) // Cache TTL set to 5 minutes
    ) {
        this.address = getSignerAddress(runtime);
        this.runtime = runtime;

        const privateKey = runtime.getSetting("FLOW_PRIVATE_KEY");
        if (!privateKey) {
            elizaLogger.warn(
                `The default Flow wallet ${this.address} has no private key`
            );
        } else {
            this.privateKeyHex = privateKey.startsWith("0x")
                ? privateKey.slice(2)
                : privateKey;
        }
    }

    /**
     * Get the network type
     */
    get network() {
        return this.connector.network;
    }

    /**
     * Send a transaction
     * @param code Cadence code
     * @param args Cadence arguments
     */
    async sendTransaction(
        code: string,
        args: fcl.ArgumentFunction,
        authz?: fcl.FclAuthorization
    ) {
        return await this.connector.sendTransaction(
            code,
            args,
            authz ?? this.buildAuthorization()
        );
    }

    /**
     * Execute a script
     * @param code Cadence code
     * @param args Cadence arguments
     */
    async executeScript<T>(
        code: string,
        args: fcl.ArgumentFunction,
        defaultValue: T
    ): Promise<T> {
        return await this.connector.executeScript(code, args, defaultValue);
    }

    /**
     * Build authorization
     */
    buildAuthorization(accountIndex = 0, privateKey = this.privateKeyHex) {
        if (this.account) {
            if (accountIndex > this.maxKeyIndex) {
                throw new Exception(50200, "Invalid account index");
            }
        }
        const address = this.address;
        if (!privateKey) {
            throw new Exception(50200, "No private key provided");
        }
        return (account: any) => {
            return {
                ...account,
                tempId: `${address}-${accountIndex}`,
                addr: fcl.sansPrefix(address),
                keyId: Number(accountIndex),
                signingFunction: (
                    signable: any
                ): Promise<CompositeSignature> => {
                    return Promise.resolve({
                        f_type: "CompositeSignature",
                        f_vsn: "1.0.0",
                        addr: fcl.withPrefix(address),
                        keyId: Number(accountIndex),
                        signature: this.signMessage(
                            signable.message,
                            privateKey
                        ),
                    });
                },
            };
        };
    }

    /**
     * Sign a message
     * @param message Message to sign
     */
    signMessage(message: string, privateKey = this.privateKeyHex) {
        return PureSigner.signWithKey(privateKey, message);
    }

    // -----  methods -----

    /**
     * Sync account info
     */
    async syncAccountInfo() {
        this.account = await this.connector.getAccount(this.address);
        this.maxKeyIndex = this.account.keys.length - 1;
        this.cache.set("balance", this.account.balance / 1e8);
        elizaLogger.debug("Flow account info synced", {
            address: this.address,
            balance: this.account.balance,
            maxKeyIndex: this.maxKeyIndex,
            keys: this.account.keys,
        });
    }

    /**
     * Get the wallet balance
     * @returns Wallet balance
     */
    async getWalletBalance(forceRefresh = false): Promise<number> {
        const cachedBalance = await this.cache.get<number>("balance");
        if (!forceRefresh && cachedBalance) {
            return cachedBalance;
        }
        await this.syncAccountInfo();
        return this.account ? this.account.balance / 1e8 : 0;
    }

    /**
     * Query the balance of this wallet
     */
    async queryAccountBalanceInfo() {
        return await queries.queryAccountBalanceInfo(this, this.address);
    }
}

// ----- Helpers -----

/**
 * Check if an address is a Flow address
 * @param address Address to check
 */
export function isFlowAddress(address: string) {
    const regExp = /^0x[a-fA-F0-9]{16}$/gi;
    return regExp.test(address);
}

/**
 * Check if an address is an EVM address
 * @param address Address to check
 */
export function isEVMAddress(address: string) {
    const regExp = /^0x[a-fA-F0-9]{40}$/gi;
    return regExp.test(address);
}

/**
 * Check if a string is a Cadence identifier
 * @param str String to check
 */
export function isCadenceIdentifier(str: string) {
    const cadenceIdentifier = /^A\.[0-9a-fA-F]{16}\.[0-9a-zA-Z_]+/;
    return cadenceIdentifier.test(str);
}

/**
 * Get the signer address
 */
function getSignerAddress(runtime: IAgentRuntime): string {
    const signerAddr = runtime.getSetting("FLOW_ADDRESS");
    if (!signerAddr) {
        elizaLogger.error("No signer address");
        throw new Exception(50200, "No signer info");
    }
    return signerAddr;
}

const flowWalletProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> => {
        // Check if the user has an Flow wallet
        if (
            !runtime.getSetting("FLOW_ADDRESS") ||
            !runtime.getSetting("FLOW_PRIVATE_KEY")
        ) {
            elizaLogger.error(
                "FLOW_ADDRESS or FLOW_PRIVATE_KEY not configured, skipping wallet injection"
            );
            return null;
        }

        try {
            const connector = await getFlowConnectorInstance(runtime);
            const walletProvider = new FlowWalletProvider(runtime, connector);
            const info = await walletProvider.queryAccountBalanceInfo();
            if (!info || info?.address !== walletProvider.address) {
                elizaLogger.error("Invalid account info");
                return null;
            }
            let output = `Here is user<${runtime.character.name}>'s wallet status:\n`;
            output += `Flow wallet address: ${walletProvider.address}\n`;
            output += `FLOW balance: ${info.balance} FLOW\n`;
            output += `Flow wallet's COA(EVM) address: ${info.coaAddress || "unknown"}\n`;
            output += `FLOW balance in COA(EVM) address: ${info.coaBalance ?? 0} FLOW`;
            return output;
        } catch (error) {
            elizaLogger.error("Error in Flow wallet provider:", error.message);
            return null;
        }
    },
};

// Module exports
export { flowWalletProvider };
