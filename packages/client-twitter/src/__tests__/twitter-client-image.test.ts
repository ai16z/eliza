import { describe, expect, test, beforeEach, vi, afterEach } from 'vitest';
import { ClientBase } from '../base';
import { TwitterPostClient } from '../post';
import { IAgentRuntime, IImageDescriptionService, ServiceType, UUID } from '@elizaos/core';
import { elizaLogger } from '@elizaos/core';
import path from 'path';

describe('Twitter Client Image Tests', () => {
    let client: ClientBase;
    let postClient: TwitterPostClient;
    let mockRuntime: IAgentRuntime;
    let mockImageService: Partial<IImageDescriptionService>;

    const mockTweetResponse = {
        data: {
            create_tweet: {
                tweet_results: {
                    result: {
                        rest_id: '123456789',
                        legacy: {
                            full_text: 'Test tweet with image\nDescription for https://example.com/test.jpg',
                            conversation_id_str: '123456789',
                            created_at: '2024-01-01T00:00:00.000Z',
                            in_reply_to_status_id_str: null
                        }
                    }
                }
            }
        }
    };

    beforeEach(() => {
        // Add logging for test setup
        elizaLogger.debug('Setting up test mocks and configuration...');

        // Mock the image description service
        mockImageService = {
            serviceType: ServiceType.IMAGE_DESCRIPTION,
            initialize: vi.fn().mockImplementation(() => {
                elizaLogger.debug('Initializing mock image service');
                return Promise.resolve();
            }),
            describeImage: vi.fn().mockImplementation(async (url: string) => {
                elizaLogger.debug(`Describing image: ${url}`);
                return {
                    title: 'Test Image',
                    description: `Description for ${url}`
                };
            })
        };

        // Mock the runtime with logging
        elizaLogger.debug('Setting up mock runtime...');
        mockRuntime = {
            getService: vi.fn().mockImplementation((type: ServiceType) => {
                elizaLogger.debug(`Getting service of type: ${type}`);
                return mockImageService;
            }),
            cacheManager: {
                get: vi.fn(),
                set: vi.fn()
            },
            character: {
                style: {
                    all: [],
                    post: []
                }
            },
            messageManager: {
                createMemory: vi.fn(),
                getMemoryById: vi.fn()
            },
            ensureRoomExists: vi.fn(),
            ensureParticipantInRoom: vi.fn(),
            ensureUserExists: vi.fn(),
            agentId: '123' as UUID
        } as any;

        // Mock Twitter config
        elizaLogger.debug('Setting up Twitter client configuration...');
        const mockConfig = {
            TWITTER_USERNAME: 'test_user',
            TWITTER_PASSWORD: 'test_pass',
            TWITTER_EMAIL: 'test@example.com',
            TWITTER_2FA_SECRET: '',
            TWITTER_RETRY_LIMIT: 3,
            POST_INTERVAL_MIN: 1,
            POST_INTERVAL_MAX: 2,
            ENABLE_ACTION_PROCESSING: false,
            ACTION_INTERVAL: 5,
            POST_IMMEDIATELY: false,
            TWITTER_SEARCH_ENABLE: false,
            TWITTER_DRY_RUN: true,
            MAX_TWEET_LENGTH: 280
        };

        // Initialize clients with logging
        elizaLogger.debug('Initializing Twitter clients...');
        client = new ClientBase(mockRuntime, mockConfig);
        client.profile = {
            id: '123',
            username: 'test_user',
            screenName: 'Test User',
            bio: 'Test bio',
            nicknames: []
        };

        // Mock Twitter client methods with logging
        elizaLogger.debug('Setting up Twitter client mock methods...');
        const mockSendTweet = vi.fn().mockImplementation(async (text: string) => {
            elizaLogger.debug('Mock sending tweet with text:', text);
            return {
                json: () => Promise.resolve({
                    data: {
                        create_tweet: {
                            tweet_results: {
                                result: {
                                    rest_id: '123456789',
                                    legacy: {
                                        full_text: text,
                                        conversation_id_str: '123456789',
                                        created_at: '2024-01-01T00:00:00.000Z',
                                        in_reply_to_status_id_str: null
                                    }
                                }
                            }
                        }
                    }
                })
            };
        });

        const mockSendNoteTweet = vi.fn().mockImplementation(async (text: string) => {
            elizaLogger.debug('Mock sending note tweet with text:', text);
            return {
                data: {
                    notetweet_create: {
                        tweet_results: {
                            result: {
                                rest_id: '123456789',
                                legacy: {
                                    full_text: text,
                                    conversation_id_str: '123456789',
                                    created_at: '2024-01-01T00:00:00.000Z',
                                    in_reply_to_status_id_str: null
                                }
                            }
                        }
                    }
                }
            };
        });

        (client as any).twitterClient = {
            sendTweet: mockSendTweet,
            sendNoteTweet: mockSendNoteTweet
        };

        postClient = new TwitterPostClient(client, mockRuntime);

        // Mock logger
        vi.spyOn(elizaLogger, 'log');
        vi.spyOn(elizaLogger, 'error');
        vi.spyOn(elizaLogger, 'debug');
        
        elizaLogger.debug('Test setup complete');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('should process tweet with single image', async () => {
        elizaLogger.debug('Starting single image tweet test');
        const content = 'Test tweet with image https://example.com/test.jpg';
        const roomId = '123' as UUID;

        elizaLogger.debug(`Posting tweet with content: ${content}`);
        const result = await postClient.postTweet(
            mockRuntime,
            client,
            content,
            roomId,
            content,
            'test_user'
        );

        elizaLogger.debug('Verifying image description service call');
        expect(mockImageService.describeImage).toHaveBeenCalledWith('https://example.com/test.jpg');
        
        elizaLogger.debug('Verifying tweet content');
        expect((client as any).twitterClient.sendTweet).toHaveBeenCalledWith(
            expect.stringContaining('Test tweet with image'),
            undefined
        );
        
        elizaLogger.debug('Verifying result structure');
        expect(result).toBeDefined();
        expect(result.text).toContain('Description for https://example.com/test.jpg');
        elizaLogger.debug('Single image tweet test completed');
    });

    test('should process tweet with multiple images', async () => {
        const content = 'Test tweet with images https://example.com/1.jpg https://example.com/2.png';
        const roomId = '123' as UUID;

        const result = await postClient.postTweet(
            mockRuntime,
            client,
            content,
            roomId,
            content,
            'test_user'
        );

        expect(mockImageService.describeImage).toHaveBeenCalledTimes(2);
        expect(mockImageService.describeImage).toHaveBeenCalledWith('https://example.com/1.jpg');
        expect(mockImageService.describeImage).toHaveBeenCalledWith('https://example.com/2.png');
        expect(result.text).toContain('Image 1:');
        expect(result.text).toContain('Image 2:');
    });

    test('should handle image description errors gracefully', async () => {
        mockImageService.describeImage = vi.fn()
            .mockRejectedValueOnce(new Error('Failed to process image'))
            .mockResolvedValueOnce({ title: 'Test', description: 'Success' });

        const content = 'Test tweet with images https://example.com/fail.jpg https://example.com/success.jpg';
        const roomId = '123' as UUID;

        const result = await postClient.postTweet(
            mockRuntime,
            client,
            content,
            roomId,
            content,
            'test_user'
        );

        expect(elizaLogger.error).toHaveBeenCalledWith(
            'Failed to generate image description:',
            expect.objectContaining({
                url: 'https://example.com/fail.jpg',
                error: 'Failed to process image'
            })
        );
        expect(result.text).toContain('Success');
    });

    test('should handle long tweets with images', async () => {
        const longContent = 'A'.repeat(280) + ' https://example.com/test.jpg';
        const roomId = '123' as UUID;

        const result = await postClient.postTweet(
            mockRuntime,
            client,
            longContent,
            roomId,
            longContent,
            'test_user'
        );

        expect(mockImageService.describeImage).toHaveBeenCalled();
        expect((client as any).twitterClient.sendNoteTweet).toHaveBeenCalled();
        expect(result).toBeDefined();
    });

    test('should handle network errors when posting tweets', async () => {
        elizaLogger.debug('Starting network error test');
        
        // Setup mock error
        const mockError = new Error('Error posting tweet: Network error');
        elizaLogger.debug('Setting up mock network error:', mockError);
        (client as any).twitterClient.sendTweet = vi.fn().mockRejectedValue(mockError);
        
        const content = 'Test tweet with image https://example.com/test.jpg';
        const roomId = '123' as UUID;

        elizaLogger.debug('Attempting to post tweet that should fail');
        try {
            await postClient.postTweet(
                mockRuntime,
                client,
                content,
                roomId,
                content,
                'test_user'
            );
            throw new Error('Expected tweet posting to fail');
        } catch (error) {
            elizaLogger.debug('Caught expected error:', error);
            expect(error.message).toContain('Error posting tweet');
            expect(elizaLogger.error).toHaveBeenCalledWith(
                'Error posting tweet:',
                expect.any(Error)
            );
        }
        
        elizaLogger.debug('Network error test completed');
    });

    test('should handle malformed tweet responses', async () => {
        elizaLogger.debug('Starting malformed response test');
        
        // Setup mock malformed response
        elizaLogger.debug('Setting up mock malformed response');
        const malformedResponse = { data: null };
        (client as any).twitterClient.sendTweet = vi.fn().mockImplementation(() => {
            elizaLogger.debug('Mock sending tweet with malformed response');
            elizaLogger.error('Error sending tweet; Bad response:', malformedResponse);
            return Promise.resolve({
                json: () => {
                    elizaLogger.debug('Returning malformed response:', malformedResponse);
                    return Promise.resolve(malformedResponse);
                }
            });
        });

        const content = 'Test tweet with image https://example.com/test.jpg';
        const roomId = '123' as UUID;

        elizaLogger.debug('Attempting to post tweet with malformed response');
        const result = await postClient.postTweet(
            mockRuntime,
            client,
            content,
            roomId,
            content,
            'test_user'
        );

        elizaLogger.debug('Verifying error handling for malformed response');
        expect(result).toBeUndefined();
        expect(elizaLogger.error).toHaveBeenCalledWith(
            'Error sending tweet; Bad response:',
            malformedResponse
        );
        
        elizaLogger.debug('Malformed response test completed');
    });
}); 