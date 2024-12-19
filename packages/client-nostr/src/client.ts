import { IAgentRuntime, elizaLogger } from "@ai16z/eliza";
import NDK, { NDKEvent } from "@nostr-dev-kit/ndk";
import { NostrProfile, NostrEvent } from "./types";

export class NostrClient {
    runtime: IAgentRuntime;
    ndk: NDK;
    cache: Map<string, any>;
    lastInteractionTimestamp: Date;

    constructor(opts: {
        runtime: IAgentRuntime;
        ndk: NDK;
        cache: Map<string, any>;
    }) {
        this.cache = opts.cache;
        this.runtime = opts.runtime;
        this.ndk = opts.ndk;
        this.lastInteractionTimestamp = new Date();
    }

    async init() {
        await this.ndk.connect();
    }

    async publishNote(noteContent: string): Promise<NostrEvent | undefined> {
        try {
            const event = new NDKEvent(this.ndk);
            event.kind = 1;
            event.content = noteContent;

            await event.sign();
            await event.publish();
            elizaLogger.info(
                "Published raw Nostr event:",
                JSON.stringify(event.rawEvent())
            );
            return {
                id: event.id,
                content: event.content,
                pubkey: event.pubkey,
            };
        } catch (err) {
            elizaLogger.error("Error: ", err);
            throw err;
        }
    }

    async getUser(npub: string): Promise<NostrProfile> {
        const user = this.ndk.getUser({ npub });
        await user.fetchProfile();

        return {
            npub,
        };
    }

    async getNostrEvent(eventId: string): Promise<NostrEvent> {
        // TODO: get event
        return {
            id: eventId,
            content: "",
            pubkey: "",
        };
    }
}
