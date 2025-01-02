import { describe, it, expect, beforeEach } from '@jest/globals';
import { TwitterApiClient } from '../client';
import { TwitterApiConfig } from '../environment';
// run the test with command:pnpm --filter @elizaos/plugin-twitter-search test
describe('TwitterApiClient', () => {
    let client: TwitterApiClient;

    beforeEach(() => {
        const config: TwitterApiConfig = {
            TWITTER_API_IO_KEY: 'elizaOS_public_key_love_truth_future',
            BASE_URL: 'https://api.twitterapi.io',
            CACHE_DURATION: 30,
            RETRY_ATTEMPTS: 3,
            RETRY_DELAY: 1000
        };

        client = new TwitterApiClient(config);
    });

    describe('advancedSearch', () => {
        it('should perform advanced search successfully', async () => {
            try {
                const result = await client.advancedSearch({ query: 'elonmusk' });
                expect(result).toHaveProperty('tweets');
                expect(Array.isArray(result.tweets)).toBe(true);
                expect(result).toHaveProperty('has_next_page');
            } catch (error) {
                console.error('Test failed:', error);
                throw error;
            }
        }, 30000);
    });

    describe('getUserInfo', () => {
        it('should fetch user info successfully', async () => {
            const result = await client.getUserInfo({ userName: 'elonmusk' });
            expect(result).toHaveProperty('data');
            expect(result.data).toHaveProperty('userName');
            expect(result.data).toHaveProperty('followers');
        });
    });

    describe('getUserTimeLine', () => {
        it('should fetch user timeline successfully', async () => {
            const result = await client.getUserTimeLine({
                userName: 'elonmusk',
                include_replys: true
            });
            expect(result).toHaveProperty('tweets');
            expect(Array.isArray(result.tweets)).toBe(true);
            expect(result).toHaveProperty('has_next_page');
        });
    });

    describe('getMentions', () => {
        it('should fetch user mentions successfully', async () => {
            const result = await client.getMentions({
                userName: 'elonmusk',
                since_time: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days ago
                until_time: Math.floor(Date.now() / 1000) // now
            });
            expect(result).toHaveProperty('tweets');
            expect(Array.isArray(result.tweets)).toBe(true);
            expect(result).toHaveProperty('has_next_page');
        });
    });

    describe('getListTweets', () => {
        it('should fetch list tweets successfully', async () => {
            const result = await client.getListTweets({
                list_id: 84839422, // Twitter Official list
                since_time: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days ago
                until_time: Math.floor(Date.now() / 1000) // now
            });
            expect(result).toHaveProperty('tweets');
            expect(Array.isArray(result.tweets)).toBe(true);
            expect(result).toHaveProperty('has_next_page');
        });
    });
});
