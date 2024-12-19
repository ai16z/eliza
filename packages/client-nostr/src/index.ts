import { Client, IAgentRuntime, elizaLogger } from "@ai16z/eliza";
import NDK, { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { NostrClient } from "./client";
import { NostrPostManager } from "./post";
import { NostrInteractionManager } from "./interactions";
export class NostrAgentClient implements Client {
    client: NostrClient;
    posts: NostrPostManager;
    interactions: NostrInteractionManager;

    private nsec: string;

    constructor(
        public runtime: IAgentRuntime,
        client?: NostrClient
    ) {
        const cache = new Map<string, any>();

        // Relays are comma separated list of relay urls
        const relays_str = runtime.getSetting("NOSTR_RELAYS")!;
        const relays = relays_str.split(",");

        elizaLogger.info("Connecting to Nostr relays:", relays);

        // Nsec key is the private key for signing events
        this.nsec = runtime.getSetting("NOSTR_NSEC_KEY")!;

        const nostrClient = new NostrClient({
            runtime,
            ndk: new NDK({
                explicitRelayUrls: relays,
                signer: new NDKPrivateKeySigner(this.nsec),
            }),
            cache,
        });

        this.client = client ?? nostrClient;

        elizaLogger.info("Nostr client initialized and connected to relays.");

        this.posts = new NostrPostManager(this.client, this.runtime, cache);

        this.interactions = new NostrInteractionManager(
            this.client,
            this.runtime,
            cache
        );
    }

    async start() {
        // Initialize the client
        await this.client.init();

        // Start the posts and interactions services
        await Promise.all([this.posts.start(), this.interactions.start()]);
    }

    async stop() {
        await Promise.all([this.posts.stop(), this.interactions.stop()]);
    }
}
