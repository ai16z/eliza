import { elizaLogger, type IAgentRuntime } from "@ai16z/eliza";
import { NostrClient } from "./client";

export class NostrInteractionManager {
    private timeout: NodeJS.Timeout | undefined;
    constructor(
        public client: NostrClient,
        public runtime: IAgentRuntime,
        public cache: Map<string, any>
    ) {}

    public async start() {
        const handleInteractionsLoop = async () => {
            try {
                await this.handleInteractions();
            } catch (error) {
                elizaLogger.error(error);
                return;
            }

            this.timeout = setTimeout(
                handleInteractionsLoop,
                Number(this.runtime.getSetting("NOSTR_POLL_INTERVAL") || 120) *
                    1000 // Default to 2 minutes
            );
        };

        handleInteractionsLoop();
    }

    public async stop() {
        if (this.timeout) clearTimeout(this.timeout);
    }

    private async handleInteractions() {}
}
