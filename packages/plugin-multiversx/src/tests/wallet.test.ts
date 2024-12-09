import { describe, it, expect, beforeEach } from "vitest";
import { WalletProvider } from "../providers/wallet";

describe("WalletProvider", () => {
    let walletProvider: WalletProvider;

    beforeEach(() => {
        // Test wallet private key
        const privateKey =
            "b5a356fb7e5563e6b07887f1de0376f9c74f2affaa71d41941dbc002ea13f656";
        const network = "devnet";
        walletProvider = new WalletProvider(privateKey, network);
    });

    it("should retrieve the wallet address", () => {
        const address = walletProvider.getAddress();
        expect(address).toBeDefined();
    });
});
