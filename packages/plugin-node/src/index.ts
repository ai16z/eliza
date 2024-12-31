export * from "./services/index.ts";

import { Plugin } from "@elizaos/core";

import {
    BrowserService,
    ImageDescriptionService,
    LlamaService,
    PdfService,
    SpeechService,
    TranscriptionService,
    VideoService,
    AwsS3Service,
} from "./services/index.ts";
import { describeImage } from "./actions/describe-image.ts";

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
            new AwsS3Service(),
        ],
        actions: [describeImage],
    } as const satisfies Plugin;
}
