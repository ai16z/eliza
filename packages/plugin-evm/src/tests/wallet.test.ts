import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet, iotex, arbitrum, Chain } from "viem/chains";

import { WalletProvider } from "../providers/wallet";

const customRpcUrls = {
    mainnet: "custom-rpc.mainnet.io",
    arbitrum: "custom-rpc.base.io",
    iotex: "custom-rpc.iotex.io",
};

describe("Wallet provider", () => {
    let walletProvider: WalletProvider;
    let pk: `0x${string}`;
    let customChains: Record<string, Chain> = {};

    beforeAll(() => {
        pk = generatePrivateKey();

        const chainNames = ["iotex", "arbitrum"];
        chainNames.forEach(
            (chain) =>
                (customChains[chain] = WalletProvider.genChainFromName(chain))
        );
    });

    describe("Constructor", () => {
        it("sets address", () => {
            const account = privateKeyToAccount(pk);
            const expectedAddress = account.address;

            walletProvider = new WalletProvider(pk);

            expect(walletProvider.getAddress()).to.be.eq(expectedAddress);
        });
        it("sets default chain to ethereum mainnet", () => {
            walletProvider = new WalletProvider(pk);

            expect(walletProvider.chains.mainnet.id).to.be.eq(mainnet.id);
            expect(walletProvider.getCurrentChain().id).to.be.eq(mainnet.id);
        });
        it("sets custom chains", () => {
            walletProvider = new WalletProvider(pk, customChains);

            expect(walletProvider.chains.iotex.id).to.be.eq(iotex.id);
            expect(walletProvider.chains.arbitrum.id).to.be.eq(arbitrum.id);
        });
        it("sets the first provided custom chain as current chain", () => {
            walletProvider = new WalletProvider(pk, customChains);

            expect(walletProvider.getCurrentChain().id).to.be.eq(iotex.id);
        });
    });
    describe("Clients", () => {
        beforeEach(() => {
            walletProvider = new WalletProvider(pk);
        });
        it("generates public client", () => {
            const client = walletProvider.getPublicClient("mainnet");
            expect(client.chain.id).to.be.equal(mainnet.id);
            expect(client.transport.url).toEqual(
                mainnet.rpcUrls.default.http[0]
            );
        });
        it("generates public client with custom rpcurl", () => {
            const chain = WalletProvider.genChainFromName(
                "mainnet",
                customRpcUrls.mainnet
            );
            const wp = new WalletProvider(pk, { ["mainnet"]: chain });

            const client = wp.getPublicClient("mainnet");
            expect(client.chain.id).to.be.equal(mainnet.id);
            expect(client.chain.rpcUrls.default.http[0]).to.eq(
                mainnet.rpcUrls.default.http[0]
            );
            expect(client.chain.rpcUrls.custom.http[0]).to.eq(
                customRpcUrls.mainnet
            );
            expect(client.transport.url).toEqual(customRpcUrls.mainnet);
        });
        it("generates wallet client", () => {
            const account = privateKeyToAccount(pk);
            const expectedAddress = account.address;

            const client = walletProvider.getWalletClient("mainnet");

            expect(client.account.address).to.be.equal(expectedAddress);
            expect(client.transport.url).toEqual(
                mainnet.rpcUrls.default.http[0]
            );
        });
        it("generates wallet client with custom rpcurl", () => {
            const account = privateKeyToAccount(pk);
            const expectedAddress = account.address;
            const chain = WalletProvider.genChainFromName(
                "mainnet",
                customRpcUrls.mainnet
            );
            const wp = new WalletProvider(pk, { ["mainnet"]: chain });

            const client = wp.getWalletClient("mainnet");

            expect(client.account.address).to.be.equal(expectedAddress);
            expect(client.chain.id).to.be.equal(mainnet.id);
            expect(client.chain.rpcUrls.default.http[0]).to.eq(
                mainnet.rpcUrls.default.http[0]
            );
            expect(client.chain.rpcUrls.custom.http[0]).to.eq(
                customRpcUrls.mainnet
            );
            expect(client.transport.url).toEqual(customRpcUrls.mainnet);
        });
    });
    describe("Balance", () => {
        beforeEach(() => {
            walletProvider = new WalletProvider(pk, customChains);
        });
        it("should fetch balance", async () => {
            const bal = await walletProvider.getWalletBalance();

            expect(bal).to.be.eq("0");
        });
        it("should fetch balance for a specific added chain", async () => {
            const bal = await walletProvider.getWalletBalanceForChain("iotex");

            expect(bal).to.be.eq("0");
        });
        it("should return null if chain is not added", async () => {
            const bal = await walletProvider.getWalletBalanceForChain("base");
            expect(bal).to.be.null;
        });
    });
    describe("Chain", () => {
        beforeEach(() => {
            walletProvider = new WalletProvider(pk, customChains);
        });
        it("generates chains from chain name", () => {
            const chainName = "iotex";
            const chain: Chain = WalletProvider.genChainFromName(chainName);

            expect(chain.rpcUrls.default.http[0]).to.eq(
                iotex.rpcUrls.default.http[0]
            );
        });
        it("generates chains from chain name with custom rpc url", () => {
            const chainName = "iotex";
            const customRpcUrl = "custom.url.io";
            const chain: Chain = WalletProvider.genChainFromName(
                chainName,
                customRpcUrl
            );

            expect(chain.rpcUrls.default.http[0]).to.eq(
                iotex.rpcUrls.default.http[0]
            );
            expect(chain.rpcUrls.custom.http[0]).to.eq(customRpcUrl);
        });
        it("switches chain", () => {
            const initialChain = walletProvider.getCurrentChain().id;
            expect(initialChain).to.be.eq(iotex.id);

            walletProvider.switchChain("mainnet");

            const newChain = walletProvider.getCurrentChain().id;
            expect(newChain).to.be.eq(mainnet.id);
        });
        it("switches chain (by adding new chain)", () => {
            const initialChain = walletProvider.getCurrentChain().id;
            expect(initialChain).to.be.eq(iotex.id);

            walletProvider.switchChain("arbitrum");

            const newChain = walletProvider.getCurrentChain().id;
            expect(newChain).to.be.eq(arbitrum.id);
        });
        it("adds chain", () => {
            const initialChains = walletProvider.chains;
            expect(initialChains.base).to.be.undefined;

            const base = WalletProvider.genChainFromName("base");
            walletProvider.addChain({ base });
            const newChains = walletProvider.chains;
            expect(newChains.arbitrum.id).to.be.eq(arbitrum.id);
        });
        it("gets chain configs", () => {
            const chain = walletProvider.getChainConfigs("iotex");

            expect(chain.id).to.eq(iotex.id);
        });
        it("throws if tries to switch to an invalid chain", () => {
            const initialChain = walletProvider.getCurrentChain().id;
            expect(initialChain).to.be.eq(iotex.id);

            // @ts-ignore
            expect(() => walletProvider.switchChain("eth")).to.throw();
        });
        it("throws if unsupported chain name", () => {
            // @ts-ignore
            expect(() =>
                WalletProvider.genChainFromName("ethereum")
            ).to.throw();
        });
        it("throws if invalid chain name", () => {
            // @ts-ignore
            expect(() => WalletProvider.genChainFromName("eth")).to.throw();
        });
    });
});
