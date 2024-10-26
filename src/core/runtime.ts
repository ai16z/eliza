import { addHeader, composeContext } from "./context.ts"
import {
  defaultEvaluators,
  evaluationTemplate,
  formatEvaluatorExamples,
  formatEvaluatorNames,
  formatEvaluators
} from "./evaluators.ts"
import { embeddingZeroVector, MemoryManager } from "./memory.ts"
import {
  parseBooleanFromText,
  parseJsonArrayFromText,
  parseJSONObjectFromText,
  parseShouldRespondFromText
} from "./parsing.ts"
import {
  Character,
  Content,
  Goal,
  HandlerCallback,
  IAgentRuntime,
  IBrowserService,
  IDatabaseAdapter,
  IImageRecognitionService,
  IMemoryManager,
  IPdfService,
  ITranscriptionService,
  IVideoService,
  Media,
  Provider,
  State,
  type Action,
  type Evaluator,
  type Memory
} from "./types.ts"

import {
  default as tiktoken,
  default as TikToken,
  TiktokenModel
} from "tiktoken"
import { names, uniqueNamesGenerator } from "unique-names-generator"
import { formatFacts } from "../evaluators/fact.ts"
import { BrowserService } from "../services/browser.ts"
import ImageDescriptionService from "../services/image.ts"
import LlamaService from "../services/llama.ts"
import { PdfService } from "../services/pdf.ts"
import { SpeechService } from "../services/speech.ts"
import { TranscriptionService } from "../services/transcription.ts"
import { VideoService } from "../services/video.ts"
import { wordsToPunish } from "../services/wordsToPunish.ts"
import {
  composeActionExamples,
  formatActionNames,
  formatActions
} from "./actions.ts"
import defaultCharacter from "./defaultCharacter.ts"
import { formatGoalsAsString, getGoals } from "./goals.ts"
import { formatActors, formatMessages, getActorDetails } from "./messages.ts"
import { formatPosts } from "./posts.ts"
import { defaultProviders, getProviders } from "./providers.ts"
import settings from "./settings.ts"
import { UUID, type Actor } from "./types.ts"
import { stringToUuid } from "./uuid.ts"
import { Keypair } from "@solana/web3.js"

/**
 * Represents the runtime environment for an agent, handling message processing,
 * action registration, and interaction with external services like OpenAI and Supabase.
 */
export class AgentRuntime implements IAgentRuntime {
  /**
   * Default count for recent messages to be kept in memory.
   * @private
   */
  readonly #conversationLength = 32 as number
  /**
   * The ID of the agent
   */
  agentId: UUID
  /**
   * The base URL of the server where the agent's requests are processed.
   */
  serverUrl = "http://localhost:7998"

  /**
   * The database adapter used for interacting with the database.
   */
  databaseAdapter: IDatabaseAdapter

  /**
   * Authentication token used for securing requests.
   */
  token: string | null

  /**
   * Custom actions that the agent can perform.
   */
  actions: Action[] = []

  /**
   * Evaluators used to assess and guide the agent's responses.
   */
  evaluators: Evaluator[] = []

  /**
   * Context providers used to provide context for message generation.
   */
  providers: Provider[] = []

  /**
   * The model to use for completion.
   */
  model = settings.XAI_MODEL || "gpt-4o-mini"

  /**
   * The model to use for embedding.
   */
  embeddingModel = "text-embedding-3-small"

  /**
   * Local Llama if no OpenAI key is present
   */
  llamaService: LlamaService | null = null

  // services
  speechService: typeof SpeechService

  transcriptionService: ITranscriptionService

  imageDescriptionService: IImageRecognitionService

  browserService: IBrowserService

  videoService: IVideoService

  pdfService: IPdfService

  /**
   * Fetch function to use
   * Some environments may not have access to the global fetch function and need a custom fetch override.
   */
  fetch = fetch

  /**
   * The character to use for the agent
   */
  character: Character

  /**
   * Store messages that are sent and received by the agent.
   */
  messageManager: IMemoryManager

  /**
   * Store and recall descriptions of users based on conversations.
   */
  descriptionManager: IMemoryManager

  /**
   * Manage the fact and recall of facts.
   */
  factManager: IMemoryManager

  /**
   * Manage the creation and recall of static information (documents, historical game lore, etc)
   */
  loreManager: IMemoryManager

  /**
   * Hold large documents that can be referenced
   */
  documentsManager: IMemoryManager

  /**
   * Searchable document fragments
   */
  fragmentsManager: IMemoryManager

  /**
   * Creates an instance of AgentRuntime.
   * @param opts - The options for configuring the AgentRuntime.
   * @param opts.conversationLength - The number of messages to hold in the recent message cache.
   * @param opts.token - The JWT token, can be a JWT token if outside worker, or an OpenAI token if inside worker.
   * @param opts.serverUrl - The URL of the worker.
   * @param opts.actions - Optional custom actions.
   * @param opts.evaluators - Optional custom evaluators.
   * @param opts.providers - Optional context providers.
   * @param opts.model - The model to use for completion.
   * @param opts.embeddingModel - The model to use for embedding.
   * @param opts.agentId - Optional ID of the agent.
   * @param opts.databaseAdapter - The database adapter used for interacting with the database.
   * @param opts.fetch - Custom fetch function to use for making requests.
   */

  constructor(opts: {
    conversationLength?: number // number of messages to hold in the recent message cache
    agentId?: UUID // ID of the agent
    character?: Character // The character to use for the agent
    token: string // JWT token, can be a JWT token if outside worker, or an OpenAI token if inside worker
    serverUrl?: string // The URL of the worker
    actions?: Action[] // Optional custom actions
    evaluators?: Evaluator[] // Optional custom evaluators
    providers?: Provider[]
    model?: string // The model to use for completion
    embeddingModel?: string // The model to use for embedding
    databaseAdapter: IDatabaseAdapter // The database adapter used for interacting with the database
    fetch?: typeof fetch | unknown
    speechModelPath?: string
  }) {
    this.#conversationLength =
      opts.conversationLength ?? this.#conversationLength
    this.databaseAdapter = opts.databaseAdapter
    // use the character id if it exists, otherwise use the agentId if it is passed in, otherwise use the character name
    this.agentId =
      opts.character.id ?? opts.agentId ?? stringToUuid(opts.character.name)
    this.fetch = (opts.fetch as typeof fetch) ?? this.fetch
    this.character = opts.character || defaultCharacter
    if (!opts.databaseAdapter) {
      throw new Error("No database adapter provided")
    }

    this.messageManager = new MemoryManager({
      runtime: this,
      tableName: "messages"
    })

    this.descriptionManager = new MemoryManager({
      runtime: this,
      tableName: "descriptions"
    })

    this.factManager = new MemoryManager({
      runtime: this,
      tableName: "facts"
    })

    this.loreManager = new MemoryManager({
      runtime: this,
      tableName: "lore"
    })

    this.documentsManager = new MemoryManager({
      runtime: this,
      tableName: "documents"
    })

    this.fragmentsManager = new MemoryManager({
      runtime: this,
      tableName: "fragments"
    })

    this.serverUrl = opts.serverUrl ?? this.serverUrl
    this.model = this.getSetting("XAI_MODEL")
    this.embeddingModel =
      this.character.settings?.embeddingModel ??
      opts.embeddingModel ??
      this.embeddingModel
    if (!this.serverUrl) {
      console.warn("No serverUrl provided, defaulting to localhost")
    }

    this.token = opts.token
    ;(opts.actions ?? []).forEach((action) => {
      this.registerAction(action)
    })
    ;(opts.evaluators ?? defaultEvaluators).forEach((evaluator) => {
      this.registerEvaluator(evaluator)
    })
    ;(opts.providers ?? defaultProviders).forEach((provider) => {
      this.registerContextProvider(provider)
    })

    if (!this.getSetting("OPENAI_API_KEY") && !this.llamaService) {
      this.llamaService = LlamaService.getInstance()
    }

    this.transcriptionService = TranscriptionService.getInstance(this)

    this.imageDescriptionService = ImageDescriptionService.getInstance(this)

    this.browserService = BrowserService.getInstance(this)

    this.videoService = VideoService.getInstance(this)

    this.pdfService = new PdfService()

    // static class, no need to instantiate but we can access it like a class instance
    this.speechService = SpeechService

    if (
      opts.character &&
      opts.character.knowledge &&
      opts.character.knowledge.length > 0
    ) {
      // this.processCharacterKnowledge(opts.character.knowledge);
    }
  }

  /**
   * Processes character knowledge by creating document memories and fragment memories.
   * This function takes an array of knowledge items, creates a document memory for each item if it doesn't exist,
   * then chunks the content into fragments, embeds each fragment, and creates fragment memories.
   * @param knowledge An array of knowledge items containing id, path, and content.
   */
  private async processCharacterKnowledge(knowledge: string[]) {
    // ensure the room exists and the agent exists in the room
    this.ensureRoomExists(this.agentId)
    this.ensureUserExists(
      this.agentId,
      this.character.name,
      this.character.name
    )
    this.ensureParticipantExists(this.agentId, this.agentId)

    for (const knowledgeItem of knowledge) {
      continue
      const knowledgeId = stringToUuid(knowledgeItem)
      const existingDocument =
        await this.documentsManager.getMemoryById(knowledgeId)
      if (!existingDocument) {
        console.log(
          "Processing knowledge for ",
          this.character.name,
          " - ",
          knowledgeItem.slice(0, 100)
        )
        await this.documentsManager.createMemory({
          embedding: embeddingZeroVector,
          id: knowledgeId,
          roomId: this.agentId,
          userId: this.agentId,
          createdAt: Date.now(),
          content: {
            text: knowledgeItem
          }
        })
        const fragments = await this.splitChunks(knowledgeItem, 1200, 200)
        for (const fragment of fragments) {
          const embedding = await this.embed(fragment)
          await this.fragmentsManager.createMemory({
            id: stringToUuid(fragment),
            roomId: this.agentId,
            userId: this.agentId,
            createdAt: Date.now(),
            content: {
              source: knowledgeId,
              text: fragment
            },
            embedding
          })
        }
      }
    }
  }

  getSetting(key: string) {
    return process.env[key] || null
  }

  /**
   * Get the number of messages that are kept in the conversation buffer.
   * @returns The number of recent messages to be kept in memory.
   */
  getConversationLength() {
    return this.#conversationLength
  }

  /**
   * Register an action for the agent to perform.
   * @param action The action to register.
   */
  registerAction(action: Action) {
    this.actions.push(action)
  }

  /**
   * Register an evaluator to assess and guide the agent's responses.
   * @param evaluator The evaluator to register.
   */
  registerEvaluator(evaluator: Evaluator) {
    this.evaluators.push(evaluator)
  }

  /**
   * Register a context provider to provide context for message generation.
   * @param provider The context provider to register.
   */
  registerContextProvider(provider: Provider) {
    this.providers.push(provider)
  }

  /**
   * Send a message to the model for a text completion - receive a string back and parse how you'd like
   * @param opts - The options for the completion request.
   * @param opts.context The context of the message to be completed.
   * @param opts.stop A list of strings to stop the completion at.
   * @param opts.model The model to use for completion.
   * @param opts.frequency_penalty The frequency penalty to apply to the completion.
   * @param opts.presence_penalty The presence penalty to apply to the completion.
   * @param opts.temperature The temperature to apply to the completion.
   * @param opts.max_context_length The maximum length of the context to apply to the completion.
   * @returns The completed message.
   */
  async completion({
    context = "",
    stop = [],
    model = this.model,
    frequency_penalty = 0.0,
    presence_penalty = 0.0,
    temperature = 0.3,
    token = this.token,
    serverUrl = this.serverUrl,
    max_context_length = this.getSetting("OPENAI_API_KEY") ? 127000 : 8000,
    max_response_length = this.getSetting("OPENAI_API_KEY") ? 8192 : 4096
  }): Promise<string> {
    let retryLength = 1000 // exponential backoff
    for (let triesLeft = 5; triesLeft > 0; triesLeft--) {
      try {
        context = await this.trimTokens(
          context,
          max_context_length,
          "gpt-4o-mini"
        )
        if (!this.getSetting("OPENAI_API_KEY")) {
          console.log("queueing text completion")
          const result = await this.llamaService.queueTextCompletion(
            context,
            temperature,
            stop,
            frequency_penalty,
            presence_penalty,
            max_response_length
          )
          return result
        } else {
          const biasValue = -20.0
          const encoding = TikToken.encoding_for_model("gpt-4o-mini")

          const mappedWords = wordsToPunish.map(
            (word) => encoding.encode(word, [], "all")[0]
          )

          const tokenIds = [...new Set(mappedWords)]

          const logit_bias = tokenIds.reduce((acc, tokenId) => {
            acc[tokenId] = biasValue
            return acc
          }, {})

          const requestOptions = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: {
              stop,
              model,
              // frequency_penalty,
              // presence_penalty,
              temperature,
              max_tokens: max_response_length,
              // logit_bias,
              messages: [
                {
                  role: "user",
                  content: context
                }
              ]
            }
          }

          // if the model includes llama, set reptition_penalty to frequency_penalty
          if (model.includes("llama")) {
            ;(requestOptions.body as any).repetition_penalty =
              frequency_penalty ?? 1.4
            // delete presence_penalty and frequency_penalty
            delete (requestOptions.body as any).presence_penalty
            delete (requestOptions.body as any).logit_bias
            delete (requestOptions.body as any).frequency_penalty
          } else {
            ;(requestOptions.body as any).frequency_penalty = frequency_penalty
            ;(requestOptions.body as any).presence_penalty = presence_penalty
            ;(requestOptions.body as any).logit_bias = logit_bias
          }

          // stringify the body
          ;(requestOptions as any).body = JSON.stringify(requestOptions.body)
          console.log("requestOptions", requestOptions)
          const response = await fetch(
            `${serverUrl}/chat/completions`,
            requestOptions as any
          )

          if (!response.ok) {
            console.log("response is", response)
            throw new Error(
              "OpenAI API Error: " + response.status + " " + response.statusText
            )
          }

          const body = await response.json()

          interface OpenAIResponse {
            choices: Array<{ message: { content: string } }>
          }

          console.log("context is", context)

          const content = (body as OpenAIResponse).choices?.[0]?.message
            ?.content

          console.log("Message is", content)

          if (!content) {
            throw new Error("No content in response")
          }
          return content
        }
      } catch (error) {
        console.error("ERROR:", error)
        // wait for 2 seconds
        retryLength *= 2
        await new Promise((resolve) => setTimeout(resolve, retryLength))
        console.log("Retrying...")
      }
    }
    throw new Error(
      "Failed to complete message after 5 tries, probably a network connectivity, model or API key issue"
    )
  }

  /**
   * Truncate the context to the maximum length allowed by the model.
   * @param model The model to use for completion.
   * @param context The context of the message to be completed.
   * @param max_context_length The maximum length of the context to apply to the completion.
   * @returns
   */
  trimTokens(context, maxTokens, model = this.model) {
    // Count tokens and truncate context if necessary
    const encoding = tiktoken.encoding_for_model(model as TiktokenModel)
    let tokens = encoding.encode(context)
    const textDecoder = new TextDecoder()
    if (tokens.length > maxTokens) {
      tokens = tokens.reverse().slice(maxTokens).reverse()

      context = textDecoder.decode(encoding.decode(tokens))
    }
    return context
  }

  async shouldRespondCompletion({
    context = "",
    stop = [],
    model = this.model,
    frequency_penalty = 0.0,
    presence_penalty = 0.0,
    temperature = 0.3,
    serverUrl = this.serverUrl,
    max_context_length = this.getSetting("OPENAI_API_KEY") ? 127000 : 8000,
    max_response_length = this.getSetting("OPENAI_API_KEY") ? 8192 : 4096
  }): Promise<"RESPOND" | "IGNORE" | "STOP" | null> {
    let retryDelay = 1000

    while (true) {
      try {
        const response = await this.completion({
          context,
          stop,
          model,
          serverUrl,
          frequency_penalty,
          presence_penalty,
          temperature,
          max_context_length,
          max_response_length
        })

        const parsedResponse = parseShouldRespondFromText(response.trim())
        if (parsedResponse) {
          return parsedResponse
        } else {
          console.log("shouldRespondCompletion no response")
        }
      } catch (error) {
        console.error("Error in shouldRespondCompletion:", error)
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      retryDelay *= 2
    }
  }

  async splitChunks(
    content: string,
    chunkSize: number,
    bleed: number = 100,
    model = this.model
  ): Promise<string[]> {
    const encoding = tiktoken.encoding_for_model(model as TiktokenModel)
    const tokens = encoding.encode(content)
    const chunks: string[] = []
    const textDecoder = new TextDecoder()

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize)
      const decodedChunk = textDecoder.decode(encoding.decode(chunk))

      // Append bleed characters from the previous chunk
      const startBleed = i > 0 ? content.slice(i - bleed, i) : ""
      // Append bleed characters from the next chunk
      const endBleed =
        i + chunkSize < tokens.length
          ? content.slice(i + chunkSize, i + chunkSize + bleed)
          : ""

      chunks.push(startBleed + decodedChunk + endBleed)
    }

    return chunks
  }

  async booleanCompletion({
    context = "",
    stop = [],
    model = this.model,
    frequency_penalty = 0.0,
    presence_penalty = 0.0,
    temperature = 0.3,
    serverUrl = this.serverUrl,
    token = this.token,
    max_context_length = this.getSetting("OPENAI_API_KEY") ? 127000 : 8000,
    max_response_length = this.getSetting("OPENAI_API_KEY") ? 8192 : 4096
  }): Promise<boolean> {
    let retryDelay = 1000

    while (true) {
      try {
        const response = await this.completion({
          context,
          stop,
          model,
          serverUrl,
          token,
          frequency_penalty,
          presence_penalty,
          temperature,
          max_context_length,
          max_response_length
        })

        const parsedResponse = parseBooleanFromText(response.trim())
        if (parsedResponse !== null) {
          return parsedResponse
        }
      } catch (error) {
        console.error("Error in booleanCompletion:", error)
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      retryDelay *= 2
    }
  }

  async stringArrayCompletion({
    context = "",
    stop = [],
    model = this.model,
    frequency_penalty = 0.0,
    presence_penalty = 0.0,
    temperature = 0.3,
    serverUrl = this.serverUrl,
    token = this.token,
    max_context_length = this.getSetting("OPENAI_API_KEY") ? 127000 : 8000,
    max_response_length = this.getSetting("OPENAI_API_KEY") ? 8192 : 4096
  }): Promise<string[]> {
    let retryDelay = 1000

    while (true) {
      try {
        const response = await this.completion({
          context,
          stop,
          model,
          serverUrl,
          token,
          frequency_penalty,
          presence_penalty,
          temperature,
          max_context_length,
          max_response_length
        })

        const parsedResponse = parseJsonArrayFromText(response)
        if (parsedResponse) {
          return parsedResponse
        }
      } catch (error) {
        console.error("Error in stringArrayCompletion:", error)
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      retryDelay *= 2
    }
  }

  async objectArrayCompletion({
    context = "",
    stop = [],
    model = this.model,
    frequency_penalty = 0.0,
    presence_penalty = 0.0,
    temperature = 0.3,
    serverUrl = this.serverUrl,
    token = this.token,
    max_context_length = this.getSetting("OPENAI_API_KEY") ? 127000 : 8000,
    max_response_length = this.getSetting("OPENAI_API_KEY") ? 8192 : 4096
  }): Promise<any[]> {
    let retryDelay = 1000

    while (true) {
      try {
        const response = await this.completion({
          context,
          stop,
          model,
          serverUrl,
          token,
          frequency_penalty,
          presence_penalty,
          temperature,
          max_context_length,
          max_response_length
        })

        const parsedResponse = parseJsonArrayFromText(response)
        if (parsedResponse) {
          return parsedResponse
        }
      } catch (error) {
        console.error("Error in stringArrayCompletion:", error)
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      retryDelay *= 2
    }
  }

  /**
   * Send a message to the model for completion.
   * @param opts - The options for the completion request.
   * @param opts.context The context of the message to be completed.
   * @param opts.stop A list of strings to stop the completion at.
   * @param opts.model The model to use for completion.
   * @param opts.frequency_penalty The frequency penalty to apply to the completion.
   * @param opts.presence_penalty The presence penalty to apply to the completion.
   * @param opts.temperature The temperature to apply to the completion.
   * @param opts.max_context_length The maximum length of the context to apply to the completion.
   * @returns The completed message.
   */
  async messageCompletion({
    context = "",
    stop = [],
    model = this.model,
    frequency_penalty = 0.6,
    presence_penalty = 0.6,
    temperature = 0.3,
    serverUrl = this.serverUrl,
    token = this.token,
    max_context_length = this.getSetting("OPENAI_API_KEY") ? 127000 : 8000,
    max_response_length = this.getSetting("OPENAI_API_KEY") ? 8192 : 4096
  }): Promise<Content> {
    console.log("messageCompletion serverUrl is", serverUrl)
    context = this.trimTokens(context, max_context_length, "gpt-4o-mini")
    let retryLength = 1000 // exponential backoff
    while (true) {
      try {
        const response = await this.completion({
          context,
          serverUrl,
          stop,
          model,
          token,
          frequency_penalty,
          presence_penalty,
          temperature,
          max_context_length,
          max_response_length
        })
        console.log("response is", response)
        // try parsing the response as JSON, if null then try again
        const parsedContent = parseJSONObjectFromText(response) as Content
        console.log("parsedContent is", parsedContent)
        if (!parsedContent) {
          console.log("parsedContent is null, retrying")
          continue
        }

        return parsedContent
      } catch (error) {
        console.error("ERROR:", error)
        // wait for 2 seconds
        retryLength *= 2
        await new Promise((resolve) => setTimeout(resolve, retryLength))
        console.log("Retrying...")
      }
    }
    throw new Error(
      "Failed to complete message after 5 tries, probably a network connectivity, model or API key issue"
    )
  }

  /**
   * Send a message to the OpenAI API for embedding.
   * @param input The input to be embedded.
   * @returns The embedding of the input.
   */
  async embed(input: string) {
    if (!this.getSetting("OPENAI_API_KEY")) {
      return await this.llamaService.getEmbeddingResponse(input)
    }
    const embeddingModel = this.embeddingModel

    // Check if we already have the embedding in the lore
    const cachedEmbedding = await this.retrieveCachedEmbedding(input)
    if (cachedEmbedding) {
      return cachedEmbedding
    }

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`
      },
      body: JSON.stringify({
        input,
        model: embeddingModel,
        length: 1536
      })
    }
    try {
      const response = await fetch(
        `${this.serverUrl}/embeddings`,
        requestOptions
      )

      if (!response.ok) {
        throw new Error(
          "OpenAI API Error: " + response.status + " " + response.statusText
        )
      }

      interface OpenAIEmbeddingResponse {
        data: Array<{ embedding: number[] }>
      }

      const data: OpenAIEmbeddingResponse = await response.json()

      return data?.data?.[0].embedding
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async retrieveCachedEmbedding(input: string) {
    const similaritySearchResult =
      await this.messageManager.getCachedEmbeddings(input)
    if (similaritySearchResult.length > 0) {
      return similaritySearchResult[0].embedding
    }
    return null
  }

  /**
   * Process the actions of a message.
   * @param message The message to process.
   * @param content The content of the message to process actions from.
   */
  async processActions(
    message: Memory,
    responses: Memory[],
    state?: State,
    callback?: HandlerCallback
  ): Promise<void> {
    if (!responses[0].content?.action) {
      return
    }

    const normalizedAction = responses[0].content.action
      .toLowerCase()
      .replace("_", "")

    let action = this.actions.find(
      (a: { name: string }) =>
        a.name.toLowerCase().replace("_", "").includes(normalizedAction) ||
        normalizedAction.includes(a.name.toLowerCase().replace("_", ""))
    )

    if (!action) {
      // each action has a .similes array, lets see if we can find a match
      for (let _action of this.actions) {
        const simileAction = _action.similes.find(
          (simile) =>
            simile.toLowerCase().replace("_", "").includes(normalizedAction) ||
            normalizedAction.includes(simile.toLowerCase().replace("_", ""))
        )
        if (simileAction) {
          action = _action
          break
        }
      }
    }

    if (!action) {
      return console.warn("No action found for", responses[0].content.action)
    }

    if (!action.handler) {
      return
    }

    await action.handler(this, message, state, {}, callback)
  }

  /**
   * Evaluate the message and state using the registered evaluators.
   * @param message The message to evaluate.
   * @param state The state of the agent.
   * @returns The results of the evaluation.
   */
  async evaluate(message: Memory, state?: State) {
    const evaluatorPromises = this.evaluators.map(
      async (evaluator: Evaluator) => {
        if (!evaluator.handler) {
          return null
        }
        const result = await evaluator.validate(this, message, state)
        if (result) {
          return evaluator
        }
        return null
      }
    )

    const resolvedEvaluators = await Promise.all(evaluatorPromises)
    const evaluatorsData = resolvedEvaluators.filter(Boolean)

    // if there are no evaluators this frame, return
    if (evaluatorsData.length === 0) {
      return []
    }

    const evaluators = formatEvaluators(evaluatorsData as Evaluator[])
    const evaluatorNames = formatEvaluatorNames(evaluatorsData as Evaluator[])

    const context = composeContext({
      state: {
        ...state,
        evaluators,
        evaluatorNames
      } as State,
      template: evaluationTemplate
    })

    const result = await this.completion({
      context
    })

    const parsedResult = parseJsonArrayFromText(result) as unknown as string[]

    this.evaluators
      .filter((evaluator: Evaluator) => parsedResult?.includes(evaluator.name))
      .forEach((evaluator: Evaluator) => {
        if (!evaluator?.handler) return

        evaluator.handler(this, message)
      })

    return parsedResult
  }

  /**
   * Ensure the existence of a participant in the room. If the participant does not exist, they are added to the room.
   * @param userId - The user ID to ensure the existence of.
   * @throws An error if the participant cannot be added.
   */
  async ensureParticipantExists(userId: UUID, roomId: UUID) {
    const participants =
      await this.databaseAdapter.getParticipantsForAccount(userId)

    if (participants?.length === 0) {
      await this.databaseAdapter.addParticipant(userId, roomId)
    }
  }

  /**
   * Ensure the existence of a user in the database. If the user does not exist, they are added to the database.
   * @param userId - The user ID to ensure the existence of.
   * @param userName - The user name to ensure the existence of.
   * @returns
   */

  async ensureUserExists(
    userId: UUID,
    userName: string | null,
    name: string | null,
    email?: string | null,
    source?: string | null
  ) {
    const account = await this.databaseAdapter.getAccountById(userId)
    if (!account) {
      await this.databaseAdapter.createAccount({
        id: userId,
        name: name || userName || "Unknown User",
        username: userName || name || "Unknown",
        email: email || (userName || "Bot") + "@" + source || "Unknown", // Temporary
        details: { summary: "" }
      })
      console.log(`User ${userName} created successfully.`)
    }
  }

  async ensureParticipantInRoom(userId: UUID, roomId: UUID) {
    const participants =
      await this.databaseAdapter.getParticipantsForRoom(roomId)
    if (!participants.includes(userId)) {
      await this.databaseAdapter.addParticipant(userId, roomId)
      console.log(`User ${userId} linked to room ${roomId} successfully.`)
    }
  }

  /**
   * Ensure the existence of a room between the agent and a user. If no room exists, a new room is created and the user
   * and agent are added as participants. The room ID is returned.
   * @param userId - The user ID to create a room with.
   * @returns The room ID of the room between the agent and the user.
   * @throws An error if the room cannot be created.
   */
  async ensureRoomExists(roomId: UUID) {
    const room = await this.databaseAdapter.getRoom(roomId)
    if (!room) {
      await this.databaseAdapter.createRoom(roomId)
      console.log(`Room ${roomId} created successfully.`)
    }
  }

  /**
   * Compose the state of the agent into an object that can be passed or used for response generation.
   * @param message The message to compose the state from.
   * @returns The state of the agent.
   */
  async composeState(
    message: Memory,
    additionalKeys: { [key: string]: unknown } = {}
  ) {
    const { userId, roomId } = message

    const conversationLength = this.getConversationLength()
    const recentFactsCount = Math.ceil(this.getConversationLength() / 2)
    const relevantFactsCount = Math.ceil(this.getConversationLength() / 2)

    const [actorsData, recentMessagesData, recentFactsData, goalsData]: [
      Actor[],
      Memory[],
      Memory[],
      Goal[]
    ] = await Promise.all([
      getActorDetails({ runtime: this, roomId }),
      this.messageManager.getMemories({
        roomId,
        count: conversationLength,
        unique: false
      }),
      this.factManager.getMemories({
        roomId,
        count: recentFactsCount
      }),
      getGoals({
        runtime: this,
        count: 10,
        onlyInProgress: false,
        roomId
      })
    ])

    const goals = formatGoalsAsString({ goals: goalsData })

    let relevantFactsData: Memory[] = []

    if (recentFactsData.length > recentFactsCount) {
      relevantFactsData = (
        await this.factManager.searchMemoriesByEmbedding(
          recentFactsData[0].embedding!,
          {
            roomId,
            count: relevantFactsCount
          }
        )
      ).filter((fact: Memory) => {
        return !recentFactsData.find(
          (recentFact: Memory) => recentFact.id === fact.id
        )
      })
    }

    const actors = formatActors({ actors: actorsData ?? [] })

    const recentMessages = formatMessages({
      messages: recentMessagesData,
      actors: actorsData
    })

    const recentPosts = formatPosts({
      messages: recentMessagesData,
      actors: actorsData,
      conversationHeader: false
    })

    const recentFacts = formatFacts(recentFactsData)
    const relevantFacts = formatFacts(relevantFactsData)

    // const lore = formatLore(loreData);

    const senderName = actorsData?.find(
      (actor: Actor) => actor.id === userId
    )?.name

    // TODO: We may wish to consolidate and just accept character.name here instead of the actor name
    const agentName =
      actorsData?.find((actor: Actor) => actor.id === this.agentId)?.name ||
      this.character.name

    let allAttachments = message.content.attachments || []

    if (recentMessagesData && Array.isArray(recentMessagesData)) {
      const lastMessageWithAttachment = recentMessagesData.find(
        (msg) => msg.content.attachments && msg.content.attachments.length > 0
      )

      if (lastMessageWithAttachment) {
        const lastMessageTime = lastMessageWithAttachment.createdAt
        const oneHourBeforeLastMessage = lastMessageTime - 60 * 60 * 1000 // 1 hour before last message

        allAttachments = recentMessagesData
          .reverse()
          .map((msg) => {
            const msgTime = msg.createdAt ?? Date.now()
            const isWithinTime = msgTime >= oneHourBeforeLastMessage
            const attachments = msg.content.attachments || []
            if (!isWithinTime) {
              attachments.forEach((attachment) => {
                attachment.text = "[Hidden]"
              })
            }
            return attachments
          })
          .flat()
      }
    }

    const formattedAttachments = allAttachments
      .map(
        (attachment) =>
          `ID: ${attachment.id}
Name: ${attachment.title} 
URL: ${attachment.url}
Type: ${attachment.source}
Description: ${attachment.description}
Text: ${attachment.text}
  `
      )
      .join("\n")

    // randomly get 3 bits of lore and join them into a paragraph, divided by \n
    let lore = ""
    // Assuming this.lore is an array of lore bits
    if (this.character.lore && this.character.lore.length > 0) {
      const shuffledLore = [...this.character.lore].sort(
        () => Math.random() - 0.5
      )
      const selectedLore = shuffledLore.slice(0, 3)
      lore = selectedLore.join("\n")
    }

    const formattedCharacterPostExamples = this.character.postExamples
      .sort(() => 0.5 - Math.random())
      .map((post) => {
        let messageString = `${post}`
        return messageString
      })
      .slice(0, 50)
      .join("\n")

    const formattedCharacterMessageExamples = this.character.messageExamples
      .sort(() => 0.5 - Math.random())
      .slice(0, 5)
      .map((example) => {
        const exampleNames = Array.from({ length: 5 }, () =>
          uniqueNamesGenerator({ dictionaries: [names] })
        )

        return example
          .map((message) => {
            let messageString = `${message.user}: ${message.content.text}`
            exampleNames.forEach((name, index) => {
              const placeholder = `{{user${index + 1}}}`
              messageString = messageString.replaceAll(placeholder, name)
            })
            return messageString
          })
          .join("\n")
      })
      .join("\n\n")

    const getRecentInteractions = async (
      userA: UUID,
      userB: UUID
    ): Promise<Memory[]> => {
      // Find all rooms where userA and userB are participants
      const rooms = await this.databaseAdapter.getRoomsForParticipants([
        userA,
        userB
      ])

      // Check the existing memories in the database
      const existingMemories = await this.messageManager.getMemoriesByRoomIds({
        // filter out the current room id from rooms
        roomIds: rooms.filter((room) => room !== roomId)
      })

      // Sort messages by timestamp in descending order
      existingMemories.sort((a, b) => b.createdAt - a.createdAt)

      // Take the most recent messages
      const recentInteractionsData = existingMemories.slice(0, 20)
      return recentInteractionsData
    }

    const recentInteractions =
      userId !== this.agentId
        ? await getRecentInteractions(userId, this.agentId)
        : []

    const getRecentMessageInteractions = async (
      recentInteractionsData: Memory[]
    ): Promise<string> => {
      // Format the recent messages
      const formattedInteractions = await recentInteractionsData
        .map(async (message) => {
          const isSelf = message.userId === this.agentId
          let sender
          if (isSelf) {
            sender = this.character.name
          } else {
            const accountId = await this.databaseAdapter.getAccountById(
              message.userId
            )
            sender = accountId?.username || "unknown"
          }
          return `${sender}: ${message.content.text}`
        })
        .join("\n")

      return formattedInteractions
    }

    const formattedMessageInteractions =
      await getRecentMessageInteractions(recentInteractions)

    const getRecentPostInteractions = async (
      recentInteractionsData: Memory[],
      actors: Actor[]
    ): Promise<string> => {
      const formattedInteractions = formatPosts({
        messages: recentInteractionsData,
        actors,
        conversationHeader: true
      })

      return formattedInteractions
    }

    const formattedPostInteractions = await getRecentPostInteractions(
      recentInteractions,
      actorsData
    )

    // if bio is a string, use it. if its an array, pick one at random
    let bio = this.character.bio || ""
    if (Array.isArray(bio)) {
      // get three random bio strings and join them with " "
      bio = bio
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .join(" ")
    }

    const initialState = {
      agentId: this.agentId,
      // Character file stuff
      agentName,
      bio,
      lore,
      adjective:
        this.character.adjectives && this.character.adjectives.length > 0
          ? this.character.adjectives[
              Math.floor(Math.random() * this.character.adjectives.length)
            ]
          : "",
      // Recent interactions between the sender and receiver, formatted as messages
      recentMessageInteractions: formattedMessageInteractions,
      // Recent interactions between the sender and receiver, formatted as posts
      recentPostInteractions: formattedPostInteractions,
      // Raw memory[] array of interactions
      recentInteractionsData: recentInteractions,
      // randomly pick one topic
      topic:
        this.character.topics && this.character.topics.length > 0
          ? this.character.topics[
              Math.floor(Math.random() * this.character.topics.length)
            ]
          : null,
      topics:
        this.character.topics && this.character.topics.length > 0
          ? `${this.character.name} is interested in ` +
            this.character.topics
              .sort(() => 0.5 - Math.random())
              .slice(0, 5)
              .map((topic, index) => {
                if (index === this.character.topics.length - 2) {
                  return topic + " and "
                }
                // if last topic, don't add a comma
                if (index === this.character.topics.length - 1) {
                  return topic
                }
                return topic + ", "
              })
              .join("")
          : "",
      characterPostExamples:
        formattedCharacterPostExamples &&
        formattedCharacterPostExamples.replaceAll("\n", "").length > 0
          ? addHeader(
              `# Example Posts for ${this.character.name}`,
              formattedCharacterPostExamples
            )
          : "",
      characterMessageExamples:
        formattedCharacterMessageExamples &&
        formattedCharacterMessageExamples.replaceAll("\n", "").length > 0
          ? addHeader(
              `# Example Conversations for ${this.character.name}`,
              formattedCharacterMessageExamples
            )
          : "",
      messageDirections:
        this.character?.style?.all?.length > 0 ||
        this.character?.style?.chat.length > 0
          ? addHeader(
              "# Message Directions for " + this.character.name,
              (() => {
                const all = this.character?.style?.all || []
                const chat = this.character?.style?.chat || []
                const shuffled = [...all, ...chat].sort(
                  () => 0.5 - Math.random()
                )
                const allSliced = shuffled.slice(0, conversationLength / 2)
                return allSliced.concat(allSliced).join("\n")
              })()
            )
          : "",
      postDirections:
        this.character?.style?.all?.length > 0 ||
        this.character?.style?.post.length > 0
          ? addHeader(
              "# Post Directions for " + this.character.name,
              (() => {
                const all = this.character?.style?.all || []
                const post = this.character?.style?.post || []
                const shuffled = [...all, ...post].sort(
                  () => 0.5 - Math.random()
                )
                return shuffled.slice(0, conversationLength / 2).join("\n")
              })()
            )
          : "",
      // Agent runtime stuff
      senderName,
      actors: actors && actors.length > 0 ? addHeader("# Actors", actors) : "",
      actorsData,
      roomId,
      goals:
        goals && goals.length > 0
          ? addHeader(
              "# Goals\n{{agentName}} should prioritize accomplishing the objectives that are in progress.",
              goals
            )
          : "",
      goalsData,
      recentMessages:
        recentMessages && recentMessages.length > 0
          ? addHeader("# Conversation Messages", recentMessages)
          : "",
      recentPosts:
        recentPosts && recentPosts.length > 0
          ? addHeader("# Posts in Thread", recentPosts)
          : "",
      recentMessagesData,
      recentFacts:
        recentFacts && recentFacts.length > 0
          ? addHeader("# Recent Facts", recentFacts)
          : "",
      recentFactsData,
      relevantFacts:
        relevantFacts && relevantFacts.length > 0
          ? addHeader("# Relevant Facts", relevantFacts)
          : "",
      relevantFactsData,
      attachments:
        formattedAttachments && formattedAttachments.length > 0
          ? addHeader("# Attachments", formattedAttachments)
          : "",
      ...additionalKeys
    }

    const actionPromises = this.actions.map(async (action: Action) => {
      const result = await action.validate(this, message, initialState)
      if (result) {
        return action
      }
      return null
    })

    const evaluatorPromises = this.evaluators.map(async (evaluator) => {
      const result = await evaluator.validate(this, message, initialState)
      if (result) {
        return evaluator
      }
      return null
    })

    const [resolvedEvaluators, resolvedActions, providers] = await Promise.all([
      Promise.all(evaluatorPromises),
      Promise.all(actionPromises),
      getProviders(this, message, initialState)
    ])

    const evaluatorsData = resolvedEvaluators.filter(Boolean) as Evaluator[]
    const actionsData = resolvedActions.filter(Boolean) as Action[]

    const actionState = {
      actionNames:
        "Possible response actions: " + formatActionNames(actionsData),
      actions:
        actionsData.length > 0
          ? addHeader("# Available Actions", formatActions(actionsData))
          : "",
      actionExamples:
        actionsData.length > 0
          ? addHeader(
              "# Action Examples",
              composeActionExamples(actionsData, 10)
            )
          : "",
      evaluatorsData,
      evaluators:
        evaluatorsData.length > 0 ? formatEvaluators(evaluatorsData) : "",
      evaluatorNames:
        evaluatorsData.length > 0 ? formatEvaluatorNames(evaluatorsData) : "",
      evaluatorExamples:
        evaluatorsData.length > 0
          ? formatEvaluatorExamples(evaluatorsData)
          : "",
      providers: addHeader(
        `# Additional Information About ${this.character.name} and The World`,
        providers
      )
    }

    return { ...initialState, ...actionState } as State
  }

  async updateRecentMessageState(state: State): Promise<State> {
    const conversationLength = this.getConversationLength()
    const recentMessagesData = await this.messageManager.getMemories({
      roomId: state.roomId,
      count: conversationLength,
      unique: false
    })

    const recentMessages = formatMessages({
      actors: state.actorsData ?? [],
      messages: recentMessagesData.map((memory: Memory) => {
        const newMemory = { ...memory }
        delete newMemory.embedding
        return newMemory
      })
    })

    let allAttachments = []

    if (recentMessagesData && Array.isArray(recentMessagesData)) {
      const lastMessageWithAttachment = recentMessagesData.find(
        (msg) => msg.content.attachments && msg.content.attachments.length > 0
      )

      if (lastMessageWithAttachment) {
        const lastMessageTime = lastMessageWithAttachment.createdAt
        const oneHourBeforeLastMessage = lastMessageTime - 60 * 60 * 1000 // 1 hour before last message

        allAttachments = recentMessagesData
          .filter((msg) => {
            const msgTime = msg.createdAt
            return msgTime >= oneHourBeforeLastMessage
          })
          .flatMap((msg) => msg.content.attachments || [])
      }
    }

    const formattedAttachments = allAttachments
      .map(
        (attachment) =>
          `ID: ${attachment.id}
Name: ${attachment.title}
URL: ${attachment.url} 
Type: ${attachment.source}
Description: ${attachment.description}
Text: ${attachment.text}
    `
      )
      .join("\n")

    return {
      ...state,
      recentMessages: addHeader("# Conversation Messages", recentMessages),
      recentMessagesData,
      attachments: formattedAttachments
    } as State
  }
}
