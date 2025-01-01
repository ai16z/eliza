import { CHAIN_ID, MNS, MNS_CONTRACTS, Provider } from "@massalabs/massa-web3";

export const getMnsTarget = async (
    provider: Provider,
    name: string
): Promise<string> => {
    const { chainId } = await provider.networkInfos();
    const mnsContract = new MNS(
        provider,
        chainId === CHAIN_ID.Mainnet
            ? MNS_CONTRACTS.mainnet
            : MNS_CONTRACTS.buildnet
    );
    return mnsContract.resolve(name);
};
