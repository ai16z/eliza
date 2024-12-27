
import { describe, expect, vi } from "vitest";
import { getEmbeddingConfig } from '../embedding';
import settings from '../settings';

vi.mock("../settings");
const mockedSettings = vi.mocked(settings);

describe('getEmbeddingConfig', () => {
  beforeEach(() => {
    // Clear the specific mock
    Object.keys(mockedSettings).forEach(key => {
    delete mockedSettings[key];
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return BGE config by default', () => {

    mockedSettings.USE_OPENAI_EMBEDDING = 'false';
    mockedSettings.USE_OLLAMA_EMBEDDING = 'false';
    mockedSettings.USE_GAIANET_EMBEDDING = 'false';
    mockedSettings.USE_VOYAGEAI_EMBEDDING = 'false';

    const config = getEmbeddingConfig();
    expect(config).toEqual({
      dimensions: 384,
      model: 'BGE-small-en-v1.5',
      provider: 'BGE',
      maxInputTokens: 1000000,
    });
  });

  it('should return GaiaNet config when USE_GAIANET_EMBEDDING is true', () => {
    mockedSettings.USE_GAIANET_EMBEDDING = 'true';
    mockedSettings.GAIANET_EMBEDDING_MODEL = 'test-model';
    mockedSettings.GAIANET_API_KEY = 'test-key';
    mockedSettings.SMALL_GAIANET_SERVER_URL = 'https://test.gaianet.ai';

    const config = getEmbeddingConfig();
    expect(config).toEqual({
      dimensions: 768,
      model: 'test-model',
      provider: 'GaiaNet',
      endpoint: 'https://test.gaianet.ai',
      apiKey: 'test-key',
      maxInputTokens: 1000000,
    });
  });


  it('should return VoyageAI config when USE_VOYAGEAI_EMBEDDING is true', () => {
    mockedSettings.USE_VOYAGEAI_EMBEDDING = 'true';
    mockedSettings.VOYAGEAI_API_KEY = 'test-key';

    const config = getEmbeddingConfig();
    expect(config).toEqual({
      dimensions: 512,
      model: 'voyage-3-lite',
      provider: 'VoyageAI',
      endpoint: 'https://api.voyageai.com/v1',
      apiKey: 'test-key',
      maxInputTokens: 1000000,
    });
  });

  it('should return OpenAI config when USE_OPENAI_EMBEDDING is true', () => {
    mockedSettings.USE_OPENAI_EMBEDDING = 'true';
    mockedSettings.OPENAI_API_KEY = 'test-key';

    const config = getEmbeddingConfig();
    expect(config).toEqual({
      dimensions: 1536,
      model: 'text-embedding-3-small',
      provider: 'OpenAI',
      endpoint: 'https://api.openai.com/v1',
      apiKey: 'test-key',
      maxInputTokens: 1000000,
    });
  });

  it('should return Ollama config when USE_OLLAMA_EMBEDDING is true', () => {
    mockedSettings.USE_OLLAMA_EMBEDDING = 'true';
    mockedSettings.OLLAMA_EMBEDDING_MODEL = 'test-model';
    mockedSettings.OLLAMA_API_KEY = 'test-key';

    const config = getEmbeddingConfig();
    expect(config).toEqual({
      dimensions: 1024,
      model: 'test-model',
      provider: 'Ollama',
      endpoint: 'https://ollama.eliza.ai/v1',
      apiKey: 'test-key',
      maxInputTokens: 1000000,
    });
  });
});