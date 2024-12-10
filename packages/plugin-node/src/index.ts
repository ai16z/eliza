export * from "./services/index.ts";

import { Plugin } from "@ai16z/eliza";

import {
    BrowserService,
    ImageDescriptionService,
    LlamaService,
    PdfService,
    SpeechService,
    TranscriptionService,
    VideoService,
    AwsS3Service
} from "./services/index.ts";

export type NodePlugin = ReturnType<typeof createNodePlugin>;

export function createNodePlugin() {
    return {
        name: "default",
        description: "Default plugin, with basic actions and evaluators",
        services: [
            new BrowserService(),
            new ImageDescriptionService(),
            new LlamaService(),
            new PdfService(),
            new SpeechService(),
            new TranscriptionService(),
            new VideoService(),
            new AwsS3Service()
        ],
    } as const satisfies Plugin;
}
