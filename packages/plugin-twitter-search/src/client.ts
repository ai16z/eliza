import { elizaLogger } from "@elizaos/core";
import { TwitterApiConfig } from "./environment";
import {
    AdvancedSearchParams,
    UserFollowersParams,
    UserInfoParams,
    TweetRepliesParams,
    AdvancedSearchResponse,
    UserInfoResponse,
    UserFollowerResponse,
    TweetRepliesResponse,
    UserMentionsResponse,
    UserMentionsParams,
    UserTimeLineParams,
    UserTimeLineResponse,
    ListTweetsLookUpParams,
    ListTweetsLookUpResponse
} from "./types";

// ## Twitter Data API Integration

// This plugin uses [TwitterAPI.io](https://twitterapi.io) for Twitter data access.
// It's a reliable, high-performance API service that helps us fetch Twitter data efficiently.

// ### 🔑 API Access
// - **Quick Start**: We provide a shared API key for immediate testing
// - **Recommended**: Get your own API key for better QPS allocation
// - **Register**: Visit [twitterapi.io](https://twitterapi.io) to get your key


// ### 📚 Available Endpoints
// - **User Data**
//   - Get user profile information
//   - Fetch user's followers
//   - Get user mentions
//   - Get user timeline
// - **Tweet Data**
//   - Advanced tweet search
//   - Fetch tweet replies
// - **List Data**
//   - List Tweets lookup
// TBD...

// ### 🎁 Special Offer for elizaOS
// - **Free Quota**: 2M API calls for this project initially
// - **For Developers**: Each contributor gets additional free quota
// - **Future Benefits**: More free quota planned based on project growth

// ### ⚡️ Key Features
// - Fast response time (~700ms)
// - High stability (1M+ proven API calls)
// - Up to 100 QPS per client
// - Standard RESTful design

// ### 💡 Note
// Using individual API keys is recommended to avoid QPS conflicts with other users.

export class TwitterApiClient {
    private config: TwitterApiConfig;
    private cache: Map<string, { data: any; timestamp: number }>;

    constructor(config: TwitterApiConfig) {
        this.config = config;
        this.cache = new Map();
    }

    private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
        const url = new URL(`${this.config.BASE_URL}${endpoint}`);

        elizaLogger.info(`Making request to: ${url.toString()}`);
        elizaLogger.debug('Request params:', params);

        const searchParams = new URLSearchParams();
        Object.entries(params)
            .filter(([_, value]) => value !== undefined)
            .forEach(([key, value]) => {
                searchParams.append(key, String(value));
            });
        url.search = searchParams.toString();

        elizaLogger.debug(`Final URL: ${url.toString()}`);
        elizaLogger.debug(`API Key: ${this.config.TWITTER_API_IO_KEY}`);

        for (let attempt = 1; attempt <= this.config.RETRY_ATTEMPTS; attempt++) {
            try {
                elizaLogger.info(`Attempt ${attempt}/${this.config.RETRY_ATTEMPTS}`);
                const response = await fetch(url, {
                    headers: {
                        'x-api-key': this.config.TWITTER_API_IO_KEY,
                        'Accept': 'application/json'
                    }
                });

                elizaLogger.debug('Response status:', response.status);
                const headers: Record<string, string> = {};
                response.headers.forEach((value, key) => {
                    headers[key] = value;
                });
                elizaLogger.debug('Response headers:', headers);

                if (!response.ok) {
                    const responseText = await response.text();
                    elizaLogger.error('API request failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        responseBody: responseText
                    });
                    throw new Error(`API request failed: ${response.statusText} (${response.status})\nResponse: ${responseText}`);
                }

                return response.json() as Promise<T>;
            } catch (error) {
                elizaLogger.error('Request error:', error);
                if (attempt === this.config.RETRY_ATTEMPTS) {
                    throw error;
                }
                elizaLogger.warn(`API request failed, attempt ${attempt}/${this.config.RETRY_ATTEMPTS}`);
                await new Promise(resolve =>
                    setTimeout(resolve, this.config.RETRY_DELAY * Math.pow(2, attempt - 1))
                );
            }
        }

        throw new Error("Max retry attempts reached");
    }

    private getCacheKey(endpoint: string, params: any): string {
        return `${endpoint}-${JSON.stringify(params)}`;
    }

    private getCachedData<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.config.CACHE_DURATION * 1000) {
            return cached.data as T;
        }
        return null;
    }

    private setCacheData(key: string, data: any): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Advanced Twitter search with rich filtering options.
    // Supports complex queries across multiple dimensions.
    // Reference: https://github.com/igorbrigadir/twitter-advanced-search
    async advancedSearch(params: AdvancedSearchParams): Promise<AdvancedSearchResponse> {
        const cacheKey = this.getCacheKey('/twitter/tweet/advanced_search', params);
        const cached = this.getCachedData<AdvancedSearchResponse>(cacheKey);

        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<AdvancedSearchResponse>(
            '/twitter/tweet/advanced_search',
            params
        );

        this.setCacheData(cacheKey, response);
        return response;
    }

    async getUserInfo(params: UserInfoParams): Promise<UserInfoResponse> {
        const cacheKey = this.getCacheKey('/twitter/user/info', params);
        const cached = this.getCachedData<UserInfoResponse>(cacheKey);

        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<UserInfoResponse>(
            '/twitter/user/info',
            params
        );

        this.setCacheData(cacheKey, response);
        return response;
    }

    async getUserFollowers(
        params: UserFollowersParams
    ): Promise<UserFollowerResponse> {
        const cacheKey = this.getCacheKey('/twitter/user/followers', params);
        const cached = this.getCachedData<UserFollowerResponse>(cacheKey);

        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<UserFollowerResponse>(
            '/twitter/user/followers',
            params
        );

        this.setCacheData(cacheKey, response);
        return response;
    }

    async getTweetReplies(
        params: TweetRepliesParams
    ): Promise<TweetRepliesResponse> {
        const cacheKey = this.getCacheKey('/twitter/tweet/replies', params);
        const cached = this.getCachedData<TweetRepliesResponse>(cacheKey);

        if (cached) {
            return cached;
        }

        const response = await this.makeRequest<TweetRepliesResponse>(
            '/twitter/tweet/replies',
            params
        );

        this.setCacheData(cacheKey, response);
        return response;
    }


    // Returns Tweets mentioning a single user specified by the requested user name.
    // By default, the most recent 20 Tweets are returned per request.
    async getMentions(params: UserMentionsParams): Promise<UserMentionsResponse> {
        const cacheKey = this.getCacheKey('/twitter/tweet/advanced_search', params);
        const cached = this.getCachedData<UserMentionsResponse>(cacheKey);

        if (cached) {
            return cached;
        }
        let userName = params.userName
        let query_key = "@" + userName
        if (params.since_time !== undefined && params.since_time !== null) {
            query_key += " since:" + params.since_time
        }
        if (params.until_time !== undefined && params.until_time !== null) {
            query_key += " until:" + params.until_time
        }
        let new_params: Record<string, string | undefined> = {
            query: query_key
        };
        if (params.cursor) {
            new_params.cursor = params.cursor;
        }
        const response = await this.makeRequest<UserMentionsResponse>(
            '/twitter/tweet/advanced_search',
            new_params
        );

        this.setCacheData(cacheKey, response);
        return response;
    }

    // Allows you to retrieve a collection of the most recent Tweets .
    // Unlike the official API which limits access to the most recent 800 tweets,
    // this API has no historical data restrictions.
    // You can retrieve any tweet that's publicly visible on Twitter - if you can see it on Twitter, our API can fetch it.
    // This is a paginated endpoint that returns 20 results per page.
    // Use the cursor parameter for navigating through pages.
    async getUserTimeLine(params: UserTimeLineParams): Promise<UserTimeLineResponse> {
        const cacheKey = this.getCacheKey('/twitter/tweet/advanced_search', params);
        const cached = this.getCachedData<UserTimeLineResponse>(cacheKey);

        if (cached) {
            return cached;
        }
        let userName = params.userName
        let query_key = "from:" + userName +" include:nativeretweets " //Native retweets are excluded by default. This shows them. In contrast to filter:, which shows only retweets, this includes retweets in addition to other tweets. Only works within the last 7-10 days or so.
        if (params.include_replys) {
            query_key += " include:replies"
        }
        if (params.since_time !== undefined && params.since_time !== null) {
            query_key += " since:" + params.since_time
        }
        if (params.until_time !== undefined && params.until_time !== null) {
            query_key += " until:" + params.until_time
        }
        let new_params: Record<string, string | undefined> = {
            query: query_key
        };
        if (params.cursor) {
            new_params.cursor = params.cursor;
        }
        const response = await this.makeRequest<UserTimeLineResponse>(
            '/twitter/tweet/advanced_search',
            new_params
        );

        this.setCacheData(cacheKey, response);
        return response;
    }


    async getListTweets(
        params: ListTweetsLookUpParams
    ): Promise<ListTweetsLookUpResponse> {
        const cacheKey = this.getCacheKey('/twitter/tweet/advanced_search', params);
        const cached = this.getCachedData<ListTweetsLookUpResponse>(cacheKey);

        if (cached) {
            return cached;
        }
        let listId = params.list_id
        let query_key = "list:" + listId +" include:nativeretweets " //Native retweets are excluded by default. This shows them. In contrast to filter:, which shows only retweets, this includes retweets in addition to other tweets. Only works within the last 7-10 days or so.
        if (params.since_time !== undefined && params.since_time !== null) {
            query_key += " since:" + params.since_time
        }
        if (params.until_time !== undefined && params.until_time !== null) {
            query_key += " until:" + params.until_time
        }
        let new_params: Record<string, string | undefined> = {
            query: query_key
        };
        if (params.cursor) {
            new_params.cursor = params.cursor;
        }
        const response = await this.makeRequest<UserTimeLineResponse>(
            '/twitter/tweet/advanced_search',
            new_params
        );

        this.setCacheData(cacheKey, response);
        return response;
    }



    // TBD support : 1. search tweet of a list 2. search tweet of a community
}
