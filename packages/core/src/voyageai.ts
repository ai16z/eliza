import settings from "./settings.ts";
import { EmbeddingConfig } from "./embedding.ts";

enum VoyageAIModel {
    // Current models
    VOYAGE_3_LARGE = 'voyage-3-large',
    VOYAGE_3 = 'voyage-3',
    VOYAGE_3_LITE = 'voyage-3-lite',
    VOYAGE_CODE_3 = 'voyage-code-3',
    VOYAGE_FINANCE_2 = 'voyage-finance-2',
    VOYAGE_LAW_2 = 'voyage-law-2',
    VOYAGE_CODE_2 = 'voyage-code-2',
    // Legacy models
    VOYAGE_MULTILINGUAL_2 = 'voyage-multilingual-2',
    VOYAGE_LARGE_2_INSTRUCT = 'voyage-large-2-instruct',
    VOYAGE_LARGE_2 = 'voyage-large-2',
    VOYAGE_2 = 'voyage-2',
    VOYAGE_LITE_02_INSTRUCT = 'voyage-lite-02-instruct',
    VOYAGE_02 = 'voyage-02',
    VOYAGE_01 = 'voyage-01',
    VOYAGE_LITE_01 = 'voyage-lite-01',
    VOYAGE_LITE_01_INSTRUCT = 'voyage-lite-01-instruct',
}

/**
 * Gets the VoyageAI embedding model to use based on settings.
 *
 * Checks if VOYAGEAI_EMBEDDING_MODEL is set in settings and validates that it's
 * a valid model name from the VoyageraiModel enum. If no model is configured,
 * defaults to VOYAGE_3_LITE.
 *
 * @returns {VoyageAIModel} The VoyageAI model to use for embeddings
 * @throws {Error} If an invalid model name is configured in settings
 */
function getVoyageAIEmbeddingModel(): VoyageAIModel {
    const modelName = settings.VOYAGEAI_EMBEDDING_MODEL ?? VoyageAIModel.VOYAGE_3_LITE;

    try {
        return modelName as VoyageAIModel;
    } catch {
        throw new Error(`Invalid voyageai embedding model: ${modelName}`);
    }
}

/**
 * Gets the embedding dimensions for the configured VoyageAI model.
 *
 * Each model supports specific dimension options. If VOYAGEAI_EMBEDDING_DIMENSIONS
 * is set in settings, validates that it's a valid option for the model.
 * Otherwise returns the default dimensions for that model.
 *
 * Dimensions by model:
 * - VOYAGE_3_LARGE: 256, 512, 1024 (default), 2048
 * - VOYAGE_3: 1024 only
 * - VOYAGE_3_LITE: 512 only
 * - VOYAGE_CODE_3: 256, 512, 1024 (default), 2048
 * - VOYAGE_FINANCE_2/LAW_2: 1024 only
 * - VOYAGE_CODE_2/LARGE_2: 1536 only
 * - All legacy models: 1024 only
 *
 * @returns {number} The embedding dimensions to use
 * @throws {Error} If an invalid dimension is configured for the model
 * @see {@link getVoyageAIEmbeddingModel}
 */
function getVoyageAIEmbeddingDimensions(): number {
    const model = getVoyageAIEmbeddingModel();

    function validateDimensions(model: VoyageAIModel, defaultDimensions: number, validOptions: number[]) {
        if (settings.VOYAGEAI_EMBEDDING_DIMENSIONS != null) {
            const dim = Number(settings.VOYAGEAI_EMBEDDING_DIMENSIONS);
            if (!validOptions.includes(dim)) {
                throw new Error(`Invalid dimensions for ${model}: ${dim}. Valid options are: ${validOptions.join(', ')}`);
            }
            return dim;
        }
        return defaultDimensions;
    }

    switch (model) {
        // Current models
        case VoyageAIModel.VOYAGE_3_LARGE:
            return validateDimensions(model, 1024, [256, 512, 1024, 2048]);

        case VoyageAIModel.VOYAGE_3:
            return validateDimensions(model, 1024, [1024]);

        case VoyageAIModel.VOYAGE_3_LITE:
            return validateDimensions(model, 512, [512]);

        case VoyageAIModel.VOYAGE_CODE_3:
            return validateDimensions(model, 1024, [256, 512, 1024, 2048]);

        case VoyageAIModel.VOYAGE_FINANCE_2:
        case VoyageAIModel.VOYAGE_LAW_2:
            return validateDimensions(model, 1024, [1024]);

        case VoyageAIModel.VOYAGE_CODE_2:
        case VoyageAIModel.VOYAGE_LARGE_2:
            return validateDimensions(model, 1536, [1536]);

        // Legacy models
        case VoyageAIModel.VOYAGE_MULTILINGUAL_2:
        case VoyageAIModel.VOYAGE_LARGE_2_INSTRUCT:
        case VoyageAIModel.VOYAGE_2:
        case VoyageAIModel.VOYAGE_LITE_02_INSTRUCT:
        case VoyageAIModel.VOYAGE_02:
        case VoyageAIModel.VOYAGE_01:
        case VoyageAIModel.VOYAGE_LITE_01:
        case VoyageAIModel.VOYAGE_LITE_01_INSTRUCT:
            return validateDimensions(model, 1024, [1024]);
    }

    // Should be unreachable.
    throw new Error(`Invalid voyageai embedding model: ${model}`);
}

/**
 * Gets the maximum number of input tokens allowed for the current VoyageAI embedding model
 *
 * Different VoyageAI models have different token limits:
 * - VOYAGE_3_LITE: 1,000,000 tokens
 * - VOYAGE_3/VOYAGE_2: 320,000 tokens
 * - Other models: 120,000 tokens
 *
 * @returns {number} The maximum number of input tokens allowed for the current model
 */
function getVoyageAIMaxInputTokens() {
    switch (getVoyageAIEmbeddingModel()) {
        case VoyageAIModel.VOYAGE_3_LITE:
            return 1000000;
        case VoyageAIModel.VOYAGE_3:
        case VoyageAIModel.VOYAGE_2:
            return 320000;
        case VoyageAIModel.VOYAGE_3_LARGE:
        case VoyageAIModel.VOYAGE_CODE_3:
        case VoyageAIModel.VOYAGE_LARGE_2_INSTRUCT:
        case VoyageAIModel.VOYAGE_FINANCE_2:
        case VoyageAIModel.VOYAGE_MULTILINGUAL_2:
        case VoyageAIModel.VOYAGE_LAW_2:
        case VoyageAIModel.VOYAGE_LARGE_2:
            return 120000;
        default:
            return 120000; // Default to most conservative limit
    }
}

export function getVoyageAIEmbeddingConfig(): EmbeddingConfig {
    return {
        dimensions: getVoyageAIEmbeddingDimensions(),
        model: getVoyageAIEmbeddingModel(),
        provider: "VoyageAI",
        maxInputTokens: getVoyageAIMaxInputTokens(),
        endpoint: "https://api.voyageai.com/v1",
        apiKey: settings.VOYAGEAI_API_KEY,
    };
}
