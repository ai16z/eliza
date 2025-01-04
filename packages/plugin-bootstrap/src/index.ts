import { Plugin } from "@elizaos/core";
import { continueAction } from "./actions/continue.ts";
import { followRoomAction } from "./actions/followRoom.ts";
import { ignoreAction } from "./actions/ignore.ts";
import { muteRoomAction } from "./actions/muteRoom.ts";
import { noneAction } from "./actions/none.ts";
import { unfollowRoomAction } from "./actions/unfollowRoom.ts";
import { unmuteRoomAction } from "./actions/unmuteRoom.ts";
import { factEvaluator } from "./evaluators/fact.ts";
import { goalEvaluator } from "./evaluators/goal.ts";
import { boredomProvider } from "./providers/boredom.ts";
import { factsProvider } from "./providers/facts.ts";
import { timeProvider } from "./providers/time.ts";
import { processInstructionsEvaluator } from "./evaluators/processInstructions.ts";

export * as actions from "./actions";
export * as evaluators from "./evaluators";
export * as providers from "./providers";

export const bootstrapPlugin: Plugin = {
    name: "bootstrap",
    description: "Agent bootstrap with basic actions and evaluators",
    actions: [
        continueAction,
        followRoomAction,
        unfollowRoomAction,
        ignoreAction,
        noneAction,
        muteRoomAction,
        unmuteRoomAction,
    ],
    evaluators: [factEvaluator, goalEvaluator, processInstructionsEvaluator],
    providers: [boredomProvider, timeProvider, factsProvider],
};
