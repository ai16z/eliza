import { Coinbase, Webhook } from "@coinbase/coinbase-sdk";
import {
    Action,
    Plugin,
    elizaLogger,
    IAgentRuntime,
    Memory,
    HandlerCallback,
    State,
    composeContext,
    generateObjectV2,
    ModelClass,
    Provider,
} from "@ai16z/eliza";
import { WebhookSchema, isWebhookContent, WebhookContent } from "../types";
import { webhookTemplate } from "../templates";

const webhookProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory) => {
        try {
            Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });

            // List all webhooks
            const resp = await Webhook.list();
            elizaLogger.log("Listing all webhooks:", resp.data);

            return {
                webhooks: resp.data.map((wh: any) => ({
                    id: wh.id,
                    url: wh.url,
                    eventType: wh.event_type,
                    status: wh.status,
                })),
            };
        } catch (error) {
            elizaLogger.error("Error in webhookProvider:", error);
            return [];
        }
    },
};

const createWebhookAction: Action = {
    name: "CREATE_WEBHOOK",
    description: "Create a new webhook using the Coinbase SDK.",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        elizaLogger.log("Validating runtime for CREATE_WEBHOOK...");
        return (
            !!(
                runtime.character.settings.secrets?.COINBASE_API_KEY ||
                process.env.COINBASE_API_KEY
            ) &&
            !!(
                runtime.character.settings.secrets?.COINBASE_PRIVATE_KEY ||
                process.env.COINBASE_PRIVATE_KEY
            )
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Starting CREATE_WEBHOOK handler...");

        try {
            Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });

            const context = composeContext({
                state,
                template: webhookTemplate, // Use the new template
            });

            const webhookDetails = await generateObjectV2({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
                schema: WebhookSchema,
            });

            if (!isWebhookContent(webhookDetails.object)) {
                callback(
                    {
                        text: "Invalid webhook details. Ensure network, URL, event type, and contract address are correctly specified.",
                    },
                    []
                );
                return;
            }

            const { networkId, notificationUri, eventType, eventFilters, eventTypeFilter } = webhookDetails.object as WebhookContent;

            const webhook = await Webhook.create({networkId, notificationUri, eventType, eventTypeFilter, eventFilters});

            elizaLogger.log("Webhook created successfully:", webhook.toString());
            callback(
                {
                    text: `Webhook created successfully: ${webhook.toString()}`,
                },
                []
            );
        } catch (error) {
            elizaLogger.error("Error during webhook creation:", error);
            callback(
                {
                    text: "Failed to create the webhook. Please check the logs for more details.",
                },
                []
            );
        }
    },
    similes: [],
    examples: []
};

export const webhookPlugin: Plugin = {
    name: "webhookPlugin",
    description: "Manages webhooks using the Coinbase SDK.",
    actions: [createWebhookAction],
    providers: [webhookProvider],
};