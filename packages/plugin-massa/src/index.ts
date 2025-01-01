import type { Plugin } from "@elizaos/core";
import transfer from "./actions/transfer";

export const massaPlugin: Plugin = {
    name: "massa",
    description: "Massa Plugin for Eliza",
    actions: [transfer],
    evaluators: [],
    providers: [],
};

export default massaPlugin;
