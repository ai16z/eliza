import { ReclaimClient } from "@reclaimprotocol/zk-fetch";
import { verifyProof, Proof } from "@reclaimprotocol/js-sdk";
import {
    IVerifiableInferenceAdapter,
    VerifiableInferenceOptions,
    VerifiableInferenceResult,
    VerifiableInferenceProvider,
    ModelProviderName,
    models,
} from "@elizaos/core";

interface ReclaimOptions {
    appId: string;
    appSecret: string;
    modelProvider?: ModelProviderName;
    token?: string;
}

export class ReclaimAdapter implements IVerifiableInferenceAdapter {
    private client: ReclaimClient;
    private options: ReclaimOptions;

    constructor(options: ReclaimOptions) {
        this.options = options;
        this.client = new ReclaimClient(
            this.options.appId,
            this.options.appSecret
        );
    }

    async generateText(
        context: string,
        modelClass: string,
        options?: VerifiableInferenceOptions
    ): Promise<VerifiableInferenceResult> {
        const provider = this.options.modelProvider || ModelProviderName.OPENAI;
        const baseEndpoint = options?.endpoint || models[provider].endpoint;
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
            case ModelProviderName.ETERNALAI:
            case ModelProviderName.REDPILL:
            case ModelProviderName.NANOGPT:
            case ModelProviderName.HYPERBOLIC:
                endpoint = `${baseEndpoint}/chat/completions`;
                authHeader = `Bearer ${apiKey}`;
                responseRegex =
                    "\\r\\n\\r\\n[a-f0-9]+\\r\\n(?<response>\\{.*\\})";
                break;
            case ModelProviderName.ANTHROPIC:
            case ModelProviderName.CLAUDE_VERTEX:
                endpoint = `${baseEndpoint}/messages`;
                authHeader = `Bearer ${apiKey}`;
                responseRegex =
                    "\\r\\n\\r\\n[a-f0-9]+\\r\\n(?<response>\\{.*\\})";
                break;
            case ModelProviderName.GOOGLE:
                endpoint = `${baseEndpoint}/models/${model}:generateContent`;
                authHeader = `Bearer ${apiKey}`;
                responseRegex = "(?<response>\\{.*\\})";
                break;
            case ModelProviderName.ALI_BAILIAN:
                endpoint = `${baseEndpoint}/chat/completions`;
                authHeader = `Bearer ${apiKey}`;
                responseRegex = "(?<response>\\{.*\\})";
                break;
            case ModelProviderName.VOLENGINE:
                endpoint = `${baseEndpoint}/text/generation`;
                authHeader = `Bearer ${apiKey}`;
                responseRegex = "(?<response>\\{.*\\})";
                break;
            case ModelProviderName.LLAMACLOUD:
            case ModelProviderName.TOGETHER:
            case ModelProviderName.AKASH_CHAT_API:
                endpoint = `${baseEndpoint}/chat/completions`;
                authHeader = `Bearer ${apiKey}`;
                responseRegex =
                    "\\r\\n\\r\\n[a-f0-9]+\\r\\n(?<response>\\{.*\\})";
                break;
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
                case ModelProviderName.ETERNALAI:
                case ModelProviderName.ALI_BAILIAN:
                case ModelProviderName.VOLENGINE:
                case ModelProviderName.LLAMACLOUD:
                case ModelProviderName.NANOGPT:
                case ModelProviderName.HYPERBOLIC:
                case ModelProviderName.TOGETHER:
                case ModelProviderName.AKASH_CHAT_API:
                    body = {
                        model,
                        messages: [{ role: "user", content: context }],
                        temperature:
                            options?.providerOptions?.temperature ||
                            models[provider].settings.temperature,
                    };
                    break;
                case ModelProviderName.ANTHROPIC:
                case ModelProviderName.CLAUDE_VERTEX:
                    body = {
                        model,
                        messages: [{ role: "user", content: context }],
                        max_tokens: models[provider].settings.maxOutputTokens,
                        temperature:
                            options?.providerOptions?.temperature ||
                            models[provider].settings.temperature,
                    };
                    break;
                case ModelProviderName.GOOGLE:
                    body = {
                        model,
                        contents: [
                            { role: "user", parts: [{ text: context }] },
                        ],
                        generationConfig: {
                            temperature:
                                options?.providerOptions?.temperature ||
                                models[provider].settings.temperature,
                        },
                    };
                    break;
                default:
                    throw new Error(`Unsupported model provider: ${provider}`);
            }

            const proof = await this.client.zkFetch(
                endpoint,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify(body),
                },
                {
                    headers: {
                        "Authorization": authHeader,
                    },
                    responseMatches: [
                        {
                            type: "regex" as const,
                            value: responseRegex,
                        },
                    ],
                    paramValues: {
                        agentName: "eliza-agent"
                    }
                }
            );

            // console.log("Proof:", proof);

            // Extract text based on provider format
            const response = JSON.parse(proof.extractedParameterValues.response);
            let text = "";
            switch (provider) {
                case ModelProviderName.GOOGLE:
                    text =
                        response.candidates?.[0]?.content?.parts?.[0]?.text ||
                        "";
                    break;
                case ModelProviderName.ANTHROPIC:
                case ModelProviderName.CLAUDE_VERTEX:
                    text = response.content?.[0]?.text || "";
                    break;
                default:
                    text = response.choices?.[0]?.message?.content || "";
            }

            return {
                text,
                proof: proof,
                provider: VerifiableInferenceProvider.RECLAIM,
                timestamp: Date.now(),
            };
        } catch (error) {
            console.error("Error in Reclaim generateText:", error);
            throw error;
        }
    }

    async verifyProof(result: VerifiableInferenceResult): Promise<boolean> {
        // Reclaim's zkFetch response is self-verifying
        const isValid = await verifyProof(result.proof as Proof);
        console.log("Proof is valid:", isValid);
        return isValid;
    }
}

export default ReclaimAdapter;
