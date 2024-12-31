import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    composeContext,
    elizaLogger,
    ModelClass,
    formatMessages,
    generateObject,
} from "@elizaos/core";
import { Scraper } from "agent-twitter-client";
import { tweetTemplate } from "../templates";
import { isTweetContent, TweetSchema } from "../types";

async function composeTweet(
    runtime: IAgentRuntime,
    _message: Memory,
    state?: State
): Promise<string> {
    try {
        const context = composeContext({
            state,
            template: tweetTemplate,
        });

        const tweetContentObject = await generateObject({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
            schema: TweetSchema,
            stop: ["\n"],
        });

        if (!isTweetContent(tweetContentObject.object)) {
            elizaLogger.error(
                "Invalid tweet content:",
                tweetContentObject.object
            );
            return;
        }

        const trimmedContent = tweetContentObject.object.text.trim();

        // Skip truncation if TWITTER_PREMIUM is true
        if (
            process.env.TWITTER_PREMIUM?.toLowerCase() !== "true" &&
            trimmedContent.length > 180
        ) {
            elizaLogger.warn(
                `Tweet too long (${trimmedContent.length} chars), truncating...`
            );
            return trimmedContent.substring(0, 177) + "...";
        }

        return trimmedContent;
    } catch (error) {
        elizaLogger.error("Error composing tweet:", error);
        throw error;
    }
}

async function postTweet(content: string): Promise<boolean> {
    try {
        const scraper = new Scraper();
        const username = process.env.TWITTER_USERNAME;
        const password = process.env.TWITTER_PASSWORD;
        const email = process.env.TWITTER_EMAIL;
        const twitter2faSecret = process.env.TWITTER_2FA_SECRET;

        if (!username || !password) {
            elizaLogger.error(
                "Twitter credentials not configured in environment"
            );
            return false;
        }

        // Login with credentials
        await scraper.login(username, password, email, twitter2faSecret);
        if (!(await scraper.isLoggedIn())) {
            elizaLogger.error("Failed to login to Twitter");
            return false;
        }

        // Send the tweet
        elizaLogger.log("Attempting to send tweet:", content);
        const result = await scraper.sendTweet(content);

        const body = await result.json();
        elizaLogger.log("Tweet response:", body);

        // Check for Twitter API errors
        if (body.errors) {
            const error = body.errors[0];
            elizaLogger.error(
                `Twitter API error (${error.code}): ${error.message}`
            );
            return false;
        }

        // Check for successful tweet creation
        if (!body?.data?.create_tweet?.tweet_results?.result) {
            elizaLogger.error(
                "Failed to post tweet: No tweet result in response"
            );
            return false;
        }

        return true;
    } catch (error) {
        // Log the full error details
        elizaLogger.error("Error posting tweet:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
            cause: error.cause,
        });
        return false;
    }
}

export const postAction: Action = {
    name: "POST_TWEET",
    similes: ["TWEET", "POST", "SEND_TWEET"],
    description: "Post a tweet to Twitter",
    validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ) => {
        const hasCredentials =
            !!process.env.TWITTER_USERNAME && !!process.env.TWITTER_PASSWORD;
        elizaLogger.log(`Has credentials: ${hasCredentials}`);

        return hasCredentials;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<boolean> => {
        try {
            // Generate tweet content using context
            const tweetContent = await composeTweet(runtime, message, state);

            if (!tweetContent) {
                elizaLogger.error("No content generated for tweet");
                return false;
            }

            elizaLogger.log(`Generated tweet content: ${tweetContent}`);

            // Check for dry run mode - explicitly check for string "true"
            if (
                process.env.TWITTER_DRY_RUN &&
                process.env.TWITTER_DRY_RUN.toLowerCase() === "true"
            ) {
                elizaLogger.info(
                    `Dry run: would have posted tweet: ${tweetContent}`
                );
                return true;
            }

            return await postTweet(tweetContent);
        } catch (error) {
            elizaLogger.error("Error in post action:", error);
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "You should tweet that" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll share this update with my followers right away!",
                    action: "POST_TWEET",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Post this tweet" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll post that as a tweet now.",
                    action: "POST_TWEET",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Share that on Twitter" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll share this message on Twitter.",
                    action: "POST_TWEET",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Post that on X" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll post this message on X right away.",
                    action: "POST_TWEET",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "You should put that on X dot com" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I'll put this message up on X.com now.",
                    action: "POST_TWEET",
                },
            },
        ],
    ],
};
