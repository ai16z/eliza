import {
    IVerifiableInferenceAdapter,
    VerifiableInferenceOptions,
    VerifiableInferenceResult,
    VerifiableInferenceProvider,
    ModelProviderName,
    models,
} from "@elizaos/core";
import { generateProof, verifyProof } from "./api";

interface OpacityOptions {
    modelProvider?: ModelProviderName;
    token: string;
    teamId: string;
    teamName: string;
    baseUrl?: string;
    opacityProverUrl: string;
}

export class OpacityAdapter implements IVerifiableInferenceAdapter {
    private options: OpacityOptions;

    constructor(options: OpacityOptions) {
        this.options = options;
    }

    async generateText(
        context: string,
        modelClass: string,
        options?: VerifiableInferenceOptions
    ): Promise<VerifiableInferenceResult> {
        const provider = this.options.modelProvider || ModelProviderName.OPENAI;
        const baseEndpoint =
            options?.endpoint ||
            `https://gateway.ai.cloudflare.com/v1/${this.options.teamId}/${this.options.teamName}`;
        const model = models[provider].model[modelClass];
        const apiKey = this.options.token;

        if (!apiKey) {
            throw new Error(
                `API key (token) is required for provider: ${provider}`
            );
        }

        // Get provider-specific endpoint
        let endpoint;
        let authHeader;
        let responseRegex;

        switch (provider) {
            case ModelProviderName.OPENAI:
                endpoint = `${baseEndpoint}/openai/chat/completions`;
                authHeader = `Bearer ${apiKey}`;
                break;
            case ModelProviderName.ETERNALAI:
            case ModelProviderName.REDPILL:
            case ModelProviderName.NANOGPT:
            case ModelProviderName.HYPERBOLIC:
            case ModelProviderName.ANTHROPIC:
            case ModelProviderName.CLAUDE_VERTEX:
            case ModelProviderName.GOOGLE:
            case ModelProviderName.ALI_BAILIAN:
            case ModelProviderName.VOLENGINE:
            case ModelProviderName.LLAMACLOUD:
            case ModelProviderName.TOGETHER:
            case ModelProviderName.AKASH_CHAT_API:
            default:
                throw new Error(`Unsupported model provider: ${provider}`);
        }

        const headers = {
            "Content-Type": "application/json",
            ...options?.headers,
        };

        try {
            let body;
            // Handle different API formats
            switch (provider) {
                case ModelProviderName.OPENAI:
                    body = {
                        model: model,
                        messages: [
                            {
                                role: "system",
                                content: context,
                            },
                        ],
                    };
                    break;
                case ModelProviderName.ETERNALAI:
                case ModelProviderName.ALI_BAILIAN:
                case ModelProviderName.VOLENGINE:
                case ModelProviderName.LLAMACLOUD:
                case ModelProviderName.NANOGPT:
                case ModelProviderName.HYPERBOLIC:
                case ModelProviderName.TOGETHER:
                case ModelProviderName.AKASH_CHAT_API:
                case ModelProviderName.ANTHROPIC:
                case ModelProviderName.CLAUDE_VERTEX:
                case ModelProviderName.GOOGLE:
                default:
                    throw new Error(`Unsupported model provider: ${provider}`);
            }

            const cloudflareResponse = await fetch(endpoint, {
                headers: { Authorization: authHeader },
                body: JSON.stringify(body),
                method: "POST",
            });
            const cloudflareLogId =
                cloudflareResponse.headers.get("cf-aig-log-id");
            const cloudflareResponseJson = await cloudflareResponse.json();

            const proof = generateProof(
                this.options.opacityProverUrl,
                cloudflareLogId
            );

            // console.log("Proof:", proof);

            // Extract text based on provider format
            // get cloudflare response
            const response = cloudflareResponseJson.choices[0];

            return {
                text: response.text,
                proof: proof,
                provider: VerifiableInferenceProvider.OPACITY,
                timestamp: Date.now(),
            };
        } catch (error) {
            console.error("Error in Opacity generateText:", error);
            throw error;
        }
    }

    async verifyProof(result: VerifiableInferenceResult): Promise<boolean> {
        const isValid = await verifyProof(
            `${this.options.opacityProverUrl}/api/verify`,
            result.proof
        );
        console.log("Proof is valid:", isValid);
        return isValid;
    }
}

export default OpacityAdapter;
