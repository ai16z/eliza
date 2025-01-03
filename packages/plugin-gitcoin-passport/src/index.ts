export * from "./actions/getScore";

import type { Plugin } from "@elizaos/core";
import { getPassportScoreAction } from "./actions/getScore";

export const passportPlugin: Plugin = {
    name: "passport",
    description: "Gitcoin passport integration plugin",
    providers: [],
    evaluators: [],
    services: [],
    actions: [getPassportScoreAction],
};

export default passportPlugin;
