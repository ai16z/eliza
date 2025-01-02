import { elizaLogger } from "@elizaos/core";
import { TwitterSearchConfig } from "./config";

export interface SearchResult {
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    // Add other fields as needed
}

export interface SearchResponse {
    results: SearchResult[];
    next_token?: string;
}

export class TwitterSearchService {
    private config: TwitterSearchConfig;
    private cache: Map<string, { data: SearchResponse; timestamp: number }>;

    constructor(config: TwitterSearchConfig) {
        this.config = config;
        this.cache = new Map();
    }

    private getCacheKey(query: string, options: any): string {
        return `${query}-${JSON.stringify(options)}`;
    }

    private isCacheValid(timestamp: number): boolean {
        const now = Date.now();
        return now - timestamp < (this.config.CACHE_DURATION || 3600) * 1000;
    }

    async search(query: string, options: {
        max_results?: number;
        next_token?: string;
    } = {}): Promise<SearchResponse> {
        const cacheKey = this.getCacheKey(query, options);
        const cached = this.cache.get(cacheKey);

        if (cached && this.isCacheValid(cached.timestamp)) {
            elizaLogger.debug("Twitter Search: Cache hit for query", query);
            return cached.data;
        }

        try {
            const response = await fetch(`${this.config.API_ENDPOINT}/search`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    max_results: options.max_results || this.config.MAX_RESULTS_PER_QUERY,
                    next_token: options.next_token
                })
            });

            if (!response.ok) {
                throw new Error(`Search API error: ${response.statusText}`);
            }

            const data: SearchResponse = await response.json();
            
            // Cache the results
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            elizaLogger.error("Twitter Search API error:", error);
            throw error;
        }
    }

    // Additional utility methods can be added here
    async searchWithRetry(query: string, options: any = {}, maxRetries = 3): Promise<SearchResponse> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.search(query, options);
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            }
        }
        throw new Error("Max retries exceeded");
    }
}
