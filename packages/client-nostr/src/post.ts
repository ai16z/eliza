import {
    IAgentRuntime,
    ModelClass,
    composeContext,
    elizaLogger,
    generateText,
    stringToUuid,
} from "@ai16z/eliza";
import { NostrClient } from "./client";
import { parseBooleanFromText } from "@ai16z/eliza";
import { postTemplate } from "./prompts";
export class NostrPostManager {
    private timeout: NodeJS.Timeout | undefined;

    constructor(
        public client: NostrClient,
        public runtime: IAgentRuntime,
        public cache: Map<string, any>
    ) {
        this.client = client;
        this.runtime = runtime;
        this.cache = cache;
    }

    public async start(postImmediately: boolean = false) {
        elizaLogger.info("Starting NostrPostManager");
        const generateNewNostrEventLoop = async () => {
            elizaLogger.info("Entering generateNewNostrEventLoop");
            const lastPost = await this.runtime.cacheManager.get<{
                timestamp: number;
            }>(
                "nostr/" + this.runtime.getSetting("NOSTR_PUBKEY") + "/lastPost"
            );

            const lastPostTimestamp = lastPost?.timestamp ?? 0;
            const minMinutes =
                parseInt(
                    this.runtime.getSetting("NOSTR_POST_INTERVAL_MIN") || "90"
                ) || 90;
            const maxMinutes =
                parseInt(
                    this.runtime.getSetting("NOSTR_POST_INTERVAL_MAX") || "180"
                ) || 180;
            const randomMinutes =
                Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) +
                minMinutes;

            const delay = randomMinutes * 60 * 1000;

            if (Date.now() > lastPostTimestamp + delay) {
                await this.generateNewNostrEvent();
            }

            setTimeout(() => {
                generateNewNostrEventLoop(); // Set up next iteration
            }, delay);

            elizaLogger.log(
                `Next Nostr note scheduled in ${randomMinutes} minutes`
            );
        };

        if (
            this.runtime.getSetting("NOSTR_POST_IMMEDIATELY") != null &&
            this.runtime.getSetting("NOSTR_POST_IMMEDIATELY") != ""
        ) {
            postImmediately = parseBooleanFromText(
                this.runtime.getSetting("NOSTR_POST_IMMEDIATELY") || "false"
            );
        }

        if (postImmediately) {
            elizaLogger.debug("Posting new Nostr note immediately");
            await this.generateNewNostrEvent();
        }
        generateNewNostrEventLoop();
    }

    public async stop() {
        if (this.timeout) clearTimeout(this.timeout);
    }

    private async generateNewNostrEvent() {
        elizaLogger.info("Generating new Nostr note");

        // For now, we'll just use the pubkey as the profile name
        const profileName = this.runtime.getSetting("NOSTR_PUBKEY");
        try {
            const roomId = stringToUuid("nostr_generate_room-" + profileName);
            await this.runtime.ensureUserExists(
                this.runtime.agentId,
                profileName,
                this.runtime.character.name,
                "nostr"
            );

            const topics = this.runtime.character.topics.join(", ");

            const state = await this.runtime.composeState(
                {
                    userId: this.runtime.agentId,
                    roomId: roomId,
                    agentId: this.runtime.agentId,
                    content: {
                        text: topics || "",
                        action: "Nostr",
                    },
                },
                {
                    nostrUserName: profileName,
                }
            );

            const context = composeContext({
                state,
                template:
                    this.runtime.character.templates?.twitterPostTemplate ||
                    postTemplate,
            });

            elizaLogger.debug("generate post prompt:\n" + context);

            const newNostrContent = await generateText({
                runtime: this.runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            // First attempt to clean content
            let cleanedContent = "";

            // Try parsing as JSON first
            try {
                const parsedResponse = JSON.parse(newNostrContent);
                if (parsedResponse.text) {
                    cleanedContent = parsedResponse.text;
                } else if (typeof parsedResponse === "string") {
                    cleanedContent = parsedResponse;
                }
            } catch (error) {
                // If not JSON, clean the raw content
                cleanedContent = newNostrContent
                    .replace(/^\s*{?\s*"text":\s*"|"\s*}?\s*$/g, "") // Remove JSON-like wrapper
                    .replace(/^['"](.*)['"]$/g, "$1") // Remove quotes
                    .replace(/\\"/g, '"') // Unescape quotes
                    .trim();
            }

            if (!cleanedContent) {
                elizaLogger.error(
                    "Failed to extract valid content from response:",
                    {
                        rawResponse: newNostrContent,
                        attempted: "JSON parsing",
                    }
                );
                return;
            }
            const content = cleanedContent;

            const removeQuotes = (str: string) =>
                str.replace(/^['"](.*)['"]$/, "$1");

            // Final cleaning
            cleanedContent = removeQuotes(content);

            if (this.runtime.getSetting("NOSTR_DRY_RUN") === "true") {
                elizaLogger.info(
                    `Dry run: would have posted Nostr: ${cleanedContent}`
                );
                return;
            }

            try {
                elizaLogger.log(`Posting new Nostr note:\n ${cleanedContent}`);
                const result = await this.client.publishNote(cleanedContent);
                elizaLogger.info(
                    "Nostr note posted successfully with id:",
                    result?.id
                );
            } catch (error) {
                elizaLogger.error("Error sending Nostr note:", error);
            }
        } catch (error) {
            elizaLogger.error("Error generating new Nostr note:", error);
        }
    }
}
