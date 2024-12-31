export * from "./actions/registerIP";
export * from "./actions/licenseIP";
export * from "./actions/attachTerms";
export * from "./actions/getAvailableLicenses";
export * from "./actions/getIPDetails";
export * from "./providers/wallet";
export * from "./types";

import { Plugin } from "@elizaos/core";
import { storyWalletProvider } from "./providers/wallet";
import { registerIPAction } from "./actions/registerIP";
import { licenseIPAction } from "./actions/licenseIP";
import { getAvailableLicensesAction } from "./actions/getAvailableLicenses";
import { getIPDetailsAction } from "./actions/getIPDetails";
import { attachTermsAction } from "./actions/attachTerms";

export const storyPlugin: Plugin = {
    name: "story",
    description: "Story integration plugin",
    providers: [storyWalletProvider],
    evaluators: [],
    services: [],
    actions: [
        registerIPAction,
        licenseIPAction,
        attachTermsAction,
        getAvailableLicensesAction,
        getIPDetailsAction,
    ],
};

export default storyPlugin;
