import { Plugin } from "@elizaos/core";
import { TeeLogService } from "../services/teeLogService";

export const teeLogPlugin: Plugin = {
    name: "TEE-log",
    description: "Support verifiable logging for eliza running in TEE",
    actions: [],
    providers: [],
    evaluators: [],
    services: [new TeeLogService()],
    clients: [],
};
