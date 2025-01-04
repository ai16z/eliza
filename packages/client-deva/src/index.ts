import { IAgentRuntime, Client, elizaLogger } from "@elizaos/core";
import { DevaClient } from "./devaClient.ts";
import { validateDevaConfig } from "./enviroment.ts";

export const DevaClientInterface: Client = {
    async start(runtime: IAgentRuntime) {
        await validateDevaConfig(runtime);

        const deva = new DevaClient(
            runtime,
            runtime.getSetting("DEVA_API_KEY"),
            runtime.getSetting("DEVA_API_BASE_URL")
        );

        await deva.start();

        elizaLogger.success(
            `✅ Deva client successfully started for character ${runtime.character.name}`
        );

        return deva;
    },
    async stop(_runtime: IAgentRuntime) {
        elizaLogger.warn("Deva client does not support stopping yet");
    },
};

export default DevaClientInterface;
