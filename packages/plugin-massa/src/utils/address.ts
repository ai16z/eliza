import { Address } from "@massalabs/massa-web3";

export const validateAddress = (address: string): Address | undefined => {
    try {
        return Address.fromString(address);
    } catch (_e) {
        return undefined;
    }
};
