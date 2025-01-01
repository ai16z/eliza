import { Plugin } from "@elizaos/core";
import transfer from "./actions/transfer";
import fetch from "./actions/fetch";

export const mplBubblegumPlugin: Plugin = {
    name: "mpl-bubblegum",
    description: "Bubblegum Plugin for Eliza",
    actions: [transfer, fetch],
    providers: [],
    evaluators: [],
    services: [],
    clients: [],
};
