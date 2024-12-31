import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    composeContext,
    generateObject,
    ActionExample,
    ModelClass,
    elizaLogger,
    ServiceType,
    IImageDescriptionService,
} from "@elizaos/core";
import { getFileLocationTemplate } from "../templates";
import { FileLocationResultSchema, isFileLocationResult } from "../types";

export const describeImage: Action = {
    name: "DESCRIBE_IMAGE",
    similes: ["DESCRIBE_PICTURE", "EXPLAIN_PICTURE", "EXPLAIN_IMAGE"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    description: "Describe an image",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        // Create context with attachments and URL
        const getFileLocationContext = composeContext({
            state,
            template: getFileLocationTemplate,
        });

        const fileLocationResultObject = await generateObject({
            runtime,
            context: getFileLocationContext,
            modelClass: ModelClass.SMALL,
            schema: FileLocationResultSchema,
            stop: ["\n"],
        });

        if (!isFileLocationResult(fileLocationResultObject?.object)) {
            elizaLogger.error("Failed to generate file location");
            return false;
        }

        const { fileLocation } = fileLocationResultObject.object;

        const { description } = await runtime
            .getService<IImageDescriptionService>(ServiceType.IMAGE_DESCRIPTION)
            .describeImage(fileLocation);

        runtime.messageManager.createMemory({
            userId: message.agentId,
            agentId: message.agentId,
            roomId: message.roomId,
            content: {
                text: description,
            },
        });

        callback({
            text: description,
        });

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you describe this image for me?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Let me analyze this image for you...",
                    action: "DESCRIBE_IMAGE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I see an orange tabby cat sitting on a windowsill. The cat appears to be relaxed and looking out the window at birds flying by. The lighting suggests it's a sunny afternoon.",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's in this picture?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll take a look at that image...",
                    action: "DESCRIBE_IMAGE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "The image shows a modern kitchen with stainless steel appliances. There's a large island counter in the center with marble countertops. The cabinets are white with sleek handles, and there's pendant lighting hanging above the island.",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Could you tell me what this image depicts?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll describe this image for you...",
                    action: "DESCRIBE_IMAGE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "This is a scenic mountain landscape at sunset. The peaks are snow-capped and reflected in a calm lake below. The sky is painted in vibrant oranges and purples, with a few wispy clouds catching the last rays of sunlight.",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
