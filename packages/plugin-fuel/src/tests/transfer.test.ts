import { describe, it, expect, beforeEach } from "vitest";

import { TransferAction } from "../actions/transfer";
import { WalletProvider } from "../providers/wallet";
import { Provider, Wallet } from "fuels";

describe("Transfer Action", () => {
    let wp: WalletProvider;

    beforeEach(async () => {
        const provider = await Provider.create(
            "https://mainnet.fuel.network/v1/graphql"
        );
        wp = new WalletProvider(
            process.env.FUEL_WALLET_PRIVATE_KEY as `0x${string}`,
            provider
        );
    });
    describe("Constructor", () => {
        it("should initialize with wallet provider", () => {
            const ta = new TransferAction(wp);

            expect(ta).toBeDefined();
        });
    });
    describe("Transfer", () => {
        let ta: TransferAction;
        let receiver: string;

        beforeEach(async () => {
            ta = new TransferAction(wp);
            const provider = await Provider.create(
                "https://mainnet.fuel.network/v1/graphql"
            );
            receiver = Wallet.generate({ provider }).address.toB256();
        });

        it("throws if not enough gas", async () => {
            await expect(
                ta.transfer({
                    toAddress: receiver,
                    amount: "1",
                })
            ).rejects.toThrow(
                `Transfer failed: The account(s) sending the transaction don't have enough funds to cover the transaction.`
            );
        });

        it("should transfer funds if there is enough balance", async () => {
            const tx = await ta.transfer({
                toAddress: receiver,
                amount: "0.00001",
            });
            expect(tx.status).toBe("success");
        });
    });
});
