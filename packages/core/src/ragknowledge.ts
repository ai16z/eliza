import { embed } from "./embedding.ts";
import elizaLogger from "./logger.ts";
import {
    IRAGKnowledgeManager,
    RAGKnowledgeItem,
    UUID,
    IAgentRuntime
} from "./types.ts";
import { splitChunks } from "./generation.ts";
import { stringToUuid } from "./uuid.ts";

/**
 * Manage knowledge in the database.
 */
export class RAGKnowledgeManager implements IRAGKnowledgeManager {
    /**
     * The AgentRuntime instance associated with this manager.
     */
    runtime: IAgentRuntime;

    /**
     * The name of the database table this manager operates on.
     */
    tableName: string;

    /**
     * Constructs a new KnowledgeManager instance.
     * @param opts Options for the manager.
     * @param opts.tableName The name of the table this manager will operate on.
     * @param opts.runtime The AgentRuntime instance associated with this manager.
     */
    constructor(opts: { tableName: string; runtime: IAgentRuntime }) {
        this.runtime = opts.runtime;
        this.tableName = opts.tableName;
    }

    private readonly defaultRAGMatchThreshold = 0.85;
    private readonly defaultRAGMatchCount = 5;

    /**
     * Common English stop words to filter out from query analysis
     */
    private readonly stopWords = new Set([
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'does', 'for', 'from', 'had',
        'has', 'have', 'he', 'her', 'his', 'how', 'hey', 'i', 'in', 'is', 'it', 'its',
        'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where',
        'which', 'who', 'will', 'with', 'would', 'there', 'their', 'they', 'your', 'you'
    ]);

    /**
     * Filters out stop words and returns meaningful terms
     */
    private getQueryTerms(query: string): string[] {
        return query.toLowerCase()
            .split(' ')
            .filter(term => term.length > 3)  // Filter very short words
            .filter(term => !this.stopWords.has(term));  // Filter stop words
    }

    /**
     * Preprocesses text content for better RAG performance.
     * @param content The text content to preprocess.
     * @returns The preprocessed text.
     */

    private preprocess(content: string): string {
        if (!content || typeof content !== "string") {
            elizaLogger.warn("Invalid input for preprocessing");
            return "";
        }

        return content
            .replace(/```[\s\S]*?```/g, "")
            .replace(/`.*?`/g, "")
            .replace(/#{1,6}\s*(.*)/g, "$1")
            .replace(/!\[(.*?)\]\(.*?\)/g, "$1")
            .replace(/\[(.*?)\]\(.*?\)/g, "$1")
            .replace(/(https?:\/\/)?(www\.)?([^\s]+\.[^\s]+)/g, "$3")
            .replace(/<@[!&]?\d+>/g, "")
            .replace(/<[^>]*>/g, "")
            .replace(/^\s*[-*_]{3,}\s*$/gm, "")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/.*/g, "")
            .replace(/\s+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[^a-zA-Z0-9\s\-_./:?=&]/g, "")
            .trim()
            .toLowerCase();
    }

    private hasProximityMatch(text: string, terms: string[]): boolean {
        const words = text.toLowerCase().split(' ');
        const positions = terms.map(term => words.findIndex(w => w.includes(term)))
            .filter(pos => pos !== -1);

        if (positions.length < 2) return false;

        // Check if any matches are within 5 words of each other
        for (let i = 0; i < positions.length - 1; i++) {
            if (Math.abs(positions[i] - positions[i + 1]) <= 5) {
                return true;
            }
        }
        return false;
    }

    async getKnowledge(params: {
        query?: string;
        id?: UUID;
        conversationContext?: string;
        limit?: number;
        agentId?: UUID;
    }): Promise<RAGKnowledgeItem[]> {
        const agentId = params.agentId || this.runtime.agentId;

        // If id is provided, do direct lookup first
        if (params.id) {
            const directResults = await this.runtime.databaseAdapter.getKnowledge({
                id: params.id,
                agentId: agentId
            });

            if (directResults.length > 0) {
                return directResults;
            }
        }

        // If no id or no direct results, perform semantic search
        if (params.query) {
            try {
                const processedQuery = this.preprocess(params.query);

                // Build search text with optional context
                let searchText = processedQuery;
                if (params.conversationContext) {
                    const relevantContext = this.preprocess(params.conversationContext);
                    searchText = `${relevantContext} ${processedQuery}`;
                }

                const embeddingArray = await embed(this.runtime, searchText);

                const embedding = new Float32Array(embeddingArray);

                // Get results with single query
                const results = await this.runtime.databaseAdapter.searchKnowledge({
                    agentId: this.runtime.agentId,
                    embedding: embedding,
                    match_threshold: this.defaultRAGMatchThreshold,
                    match_count: (params.limit || this.defaultRAGMatchCount) * 2,
                    searchText: processedQuery
                });

                // Enhanced reranking with sophisticated scoring
                const rerankedResults = results.map(result => {
                    let score = result.similarity;

                    // Check for direct query term matches
                    const queryTerms = this.getQueryTerms(processedQuery);

                    const matchingTerms = queryTerms.filter(term =>
                        result.content.text.toLowerCase().includes(term));

                    if (matchingTerms.length > 0) {
                        // Much stronger boost for matches
                        score *= (1 + (matchingTerms.length / queryTerms.length) * 2); // Double the boost

                        if (this.hasProximityMatch(result.content.text, matchingTerms)) {
                            score *= 1.5; // Stronger proximity boost
                        }
                    } else {
                        // More aggressive penalty
                        if (!params.conversationContext) {
                            score *= 0.3; // Stronger penalty
                        }
                    }

                    return {
                        ...result,
                        score,
                        matchedTerms: matchingTerms // Add for debugging
                    };
                }).sort((a, b) => b.score - a.score);

                // Filter and return results
                return rerankedResults
                    .filter(result => result.score >= this.defaultRAGMatchThreshold)
                    .slice(0, params.limit || this.defaultRAGMatchCount);

            } catch(error) {
                console.log(`[RAG Search Error] ${error}`);
                return [];
            }
        }

        // If neither id nor query provided, return empty array
        return [];
    }

    async createKnowledge(item: RAGKnowledgeItem): Promise<void> {
        if (!item.content.text) {
            elizaLogger.warn("Empty content in knowledge item");
            return;
        }

        try {
            // Process main document
            const processedContent = this.preprocess(item.content.text);
            const mainEmbeddingArray = await embed(this.runtime, processedContent);

            const mainEmbedding = new Float32Array(mainEmbeddingArray);

            // Create main document
            await this.runtime.databaseAdapter.createKnowledge({
                id: item.id,
                agentId: this.runtime.agentId,
                content: {
                    text: item.content.text,
                    metadata: {
                        ...item.content.metadata,
                        isMain: true
                    }
                },
                embedding: mainEmbedding,
                createdAt: Date.now()
            });

            // Generate and store chunks
            const chunks = await splitChunks(processedContent, 512, 20);

            for (const [index, chunk] of chunks.entries()) {
                const chunkEmbeddingArray = await embed(this.runtime, chunk);
                const chunkEmbedding = new Float32Array(chunkEmbeddingArray);
                const chunkId = `${item.id}-chunk-${index}` as UUID;

                await this.runtime.databaseAdapter.createKnowledge({
                    id: chunkId,
                    agentId: this.runtime.agentId,
                    content: {
                        text: chunk,
                        metadata: {
                            ...item.content.metadata,
                            isChunk: true,
                            originalId: item.id,
                            chunkIndex: index
                        }
                    },
                    embedding: chunkEmbedding,
                    createdAt: Date.now()
                });
            }
        } catch (error) {
            elizaLogger.error(`Error processing knowledge ${item.id}:`, error);
            throw error;
        }
    }

    async searchKnowledge(params: {
        agentId: UUID;
        embedding: Float32Array | number[];
        match_threshold?: number;
        match_count?: number;
        searchText?: string;
    }): Promise<RAGKnowledgeItem[]> {
        const {
            match_threshold = this.defaultRAGMatchThreshold,
            match_count = this.defaultRAGMatchCount,
            embedding,
            searchText
        } = params;

        const float32Embedding = Array.isArray(embedding) ? new Float32Array(embedding) : embedding;

        return await this.runtime.databaseAdapter.searchKnowledge({
            agentId: params.agentId || this.runtime.agentId,
            embedding: float32Embedding,
            match_threshold,
            match_count,
            searchText
        });
    }

    async removeKnowledge(id: UUID): Promise<void> {
        await this.runtime.databaseAdapter.removeKnowledge(id);
    }

    async clearKnowledge(shared?: boolean): Promise<void> {
        await this.runtime.databaseAdapter.clearKnowledge(this.runtime.agentId, shared ? shared : false);
    }

    async processFile(file: {
        path: string;
        content: string;
        type: 'pdf' | 'md' | 'txt';
        isShared?: boolean
    }): Promise<void> {
        let content = file.content;

        try {
            // Process based on file type
            switch(file.type) {
                case 'pdf':
                    //To-Do: Add native support for basic PDFs
                    elizaLogger.warn(`PDF files not currently supported: ${file.type}`)
                    break;
                case 'md':
                case 'txt':
                    break;
                default:
                    elizaLogger.warn(`Unsupported file type: ${file.type}`);
                    return;
            }

            elizaLogger.info(`[Processing Files] ${file.path} ${content} ${file.isShared}`)

            await this.createKnowledge({
                id: stringToUuid(file.path),
                agentId: this.runtime.agentId,
                content: {
                    text: content,
                    metadata: {
                        source: file.path,
                        type: file.type,
                        isShared: file.isShared || false
                    }
                }
            });
        } catch (error) {
            if (file.isShared && error?.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                elizaLogger.info(`Shared knowledge ${file.path} already exists in database, skipping creation`);
                return;
            }
            elizaLogger.error(`Error processing file ${file.path}:`, error);
            throw error;
        }
    }
}