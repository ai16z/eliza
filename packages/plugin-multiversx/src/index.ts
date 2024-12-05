import { Plugin } from "@ai16z/eliza";
import transfer from "./actions/transfer";
import createToken from "./actions/createToken";

export const PROVIDER_CONFIG = {
    MVX_API: "https://devnet-api.multiversx.com/",
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
};

export const multiversxPlugin: Plugin = {
    name: "multiversx",
    description: "MultiversX Plugin for Eliza",
    actions: [transfer, createToken],
    evaluators: [],
    providers: [],
};

export default multiversxPlugin;
