import { Plugin } from "@elizaos/core";

import transfer from "./actions/transfer.ts";

export const treasurePlugin: Plugin = {
    name: "treasure",
    description: "Treasure Plugin for Eliza",
    actions: [transfer],
    evaluators: [],
    providers: [],
};

export default treasurePlugin;
