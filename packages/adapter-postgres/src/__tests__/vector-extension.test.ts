import { PostgresDatabaseAdapter } from '../index';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { describe, test, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { DatabaseAdapter, elizaLogger, type Memory, type Content, EmbeddingProvider } from '@elizaos/core';

// Increase test timeout
vi.setConfig({ testTimeout: 15000 });

// Mock the @elizaos/core module
vi.mock('@elizaos/core', () => ({
    elizaLogger: {
        error: vi.fn().mockImplementation(console.error),
        info: vi.fn().mockImplementation(console.log),
        success: vi.fn().mockImplementation(console.log),
        debug: vi.fn().mockImplementation(console.log),
        warn: vi.fn().mockImplementation(console.warn),
    },
    getEmbeddingConfig: () => ({
        provider: 'OpenAI',
        dimensions: 1536,
        model: 'text-embedding-3-small'
    }),
    DatabaseAdapter: class {
        protected circuitBreaker = {
            execute: async <T>(operation: () => Promise<T>) => operation()
        };
        protected async withCircuitBreaker<T>(operation: () => Promise<T>) {
            return this.circuitBreaker.execute(operation);
        }
    },
    EmbeddingProvider: {
        OpenAI: 'OpenAI',
        Ollama: 'Ollama',
        BGE: 'BGE'
    }
}));

// Helper function to parse vector string from PostgreSQL
const parseVectorString = (vectorStr: string): number[] => {
    if (!vectorStr) return [];
    // Remove brackets and split by comma
    return vectorStr.replace(/[\[\]]/g, '').split(',').map(Number);
};

describe('PostgresDatabaseAdapter - Vector Extension Validation', () => {
    let adapter: PostgresDatabaseAdapter;
    let testClient: pg.PoolClient;
    let testPool: pg.Pool;

    const initializeDatabase = async (client: pg.PoolClient) => {
        elizaLogger.info('Initializing database with schema...');
        try {
            // Set app settings for vector dimension
            await client.query(`
                ALTER DATABASE eliza_test SET app.use_openai_embedding = 'true';
                ALTER DATABASE eliza_test SET app.use_ollama_embedding = 'false';
            `);

            // Read and execute schema file
            const schemaPath = path.resolve(__dirname, '../../schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await client.query(schema);

            // Verify schema setup
            const { rows: vectorExt } = await client.query(`
                SELECT * FROM pg_extension WHERE extname = 'vector'
            `);
            elizaLogger.info('Vector extension status:', { isInstalled: vectorExt.length > 0 });

            const { rows: dimension } = await client.query('SELECT get_embedding_dimension()');
            elizaLogger.info('Vector dimension:', { dimension: dimension[0].get_embedding_dimension });

            // Verify search path
            const { rows: searchPath } = await client.query('SHOW search_path');
            elizaLogger.info('Search path:', { searchPath: searchPath[0].search_path });

        } catch (error) {
            elizaLogger.error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    };

    const cleanDatabase = async (client: pg.PoolClient) => {
        elizaLogger.info('Starting database cleanup...');
        try {
            await client.query('DROP TABLE IF EXISTS relationships CASCADE');
            await client.query('DROP TABLE IF EXISTS participants CASCADE');
            await client.query('DROP TABLE IF EXISTS logs CASCADE');
            await client.query('DROP TABLE IF EXISTS goals CASCADE');
            await client.query('DROP TABLE IF EXISTS memories CASCADE');
            await client.query('DROP TABLE IF EXISTS rooms CASCADE');
            await client.query('DROP TABLE IF EXISTS accounts CASCADE');
            await client.query('DROP TABLE IF EXISTS cache CASCADE');
            await client.query('DROP EXTENSION IF EXISTS vector CASCADE');
            await client.query('DROP SCHEMA IF EXISTS extensions CASCADE');
            elizaLogger.success('Database cleanup completed successfully');
        } catch (error) {
            elizaLogger.error(`Database cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    };

    beforeAll(async () => {
        elizaLogger.info('Setting up test database...');
        const setupPool = new pg.Pool({
            host: 'localhost',
            port: 5433,
            database: 'eliza_test',
            user: 'postgres',
            password: 'postgres'
        });
        
        const setupClient = await setupPool.connect();
        try {
            await cleanDatabase(setupClient);
            await initializeDatabase(setupClient);
        } finally {
            await setupClient.release();
            await setupPool.end();
        }
    });

    beforeEach(async () => {
        elizaLogger.info('Setting up test environment...');
        try {
            // Setup test database connection
            testPool = new pg.Pool({
                host: 'localhost',
                port: 5433,
                database: 'eliza_test',
                user: 'postgres',
                password: 'postgres'
            });
            
            testClient = await testPool.connect();
            elizaLogger.debug('Database connection established');
            
            await cleanDatabase(testClient);
            elizaLogger.debug('Database cleaned');
            
            adapter = new PostgresDatabaseAdapter({
                host: 'localhost',
                port: 5433,
                database: 'eliza_test',
                user: 'postgres',
                password: 'postgres'
            });
            elizaLogger.success('Test environment setup completed');
        } catch (error) {
            elizaLogger.error(`Test environment setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    });

    afterEach(async () => {
        elizaLogger.info('Cleaning up test environment...');
        try {
            await cleanDatabase(testClient);
            await testClient?.release();
            await testPool?.end();
            await adapter?.close();
            elizaLogger.success('Test environment cleanup completed');
        } catch (error) {
            elizaLogger.error(`Test environment cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    });

    describe('Schema and Extension Management', () => {
        test('should initialize with vector extension', async () => {
            elizaLogger.info('Testing vector extension initialization...');
            try {
                // Act
                elizaLogger.debug('Initializing adapter...');
                await adapter.init();
                elizaLogger.success('Adapter initialized successfully');

                // Assert
                elizaLogger.debug('Verifying vector extension existence...');
                const { rows } = await testClient.query(`
                    SELECT 1 FROM pg_extension WHERE extname = 'vector'
                `);
                expect(rows.length).toBe(1);
                elizaLogger.success('Vector extension verified successfully');
            } catch (error) {
                elizaLogger.error(`Vector extension test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw error;
            }
        });

        test('should handle missing rooms table', async () => {
            elizaLogger.info('Testing rooms table creation...');
            try {
                // Act
                elizaLogger.debug('Initializing adapter...');
                await adapter.init();
                elizaLogger.success('Adapter initialized successfully');

                // Assert
                elizaLogger.debug('Verifying rooms table existence...');
                const { rows } = await testClient.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_name = 'rooms'
                    );
                `);
                expect(rows[0].exists).toBe(true);
                elizaLogger.success('Rooms table verified successfully');
            } catch (error) {
                elizaLogger.error(`Rooms table test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw error;
            }
        });

        test('should not reapply schema when everything exists', async () => {
            elizaLogger.info('Testing schema reapplication prevention...');
            try {
                // Arrange
                elizaLogger.debug('Setting up initial schema...');
                await adapter.init();
                elizaLogger.success('Initial schema setup completed');

                const spy = vi.spyOn(fs, 'readFileSync');
                elizaLogger.debug('File read spy installed');

                // Act
                elizaLogger.debug('Attempting schema reapplication...');
                await adapter.init();
                elizaLogger.success('Second initialization completed');

                // Assert
                expect(spy).not.toHaveBeenCalled();
                elizaLogger.success('Verified schema was not reapplied');
                spy.mockRestore();
            } catch (error) {
                elizaLogger.error(`Schema reapplication test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw error;
            }
        });

        test('should handle transaction rollback on error', async () => {
            elizaLogger.info('Testing transaction rollback...');
            try {
                // Arrange
                elizaLogger.debug('Setting up file read error simulation...');
                const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
                    elizaLogger.warn('Simulating schema read error');
                    throw new Error('Schema read error');
                });

                // Act & Assert
                elizaLogger.debug('Attempting initialization with error...');
                await expect(adapter.init()).rejects.toThrow('Schema read error');
                elizaLogger.success('Error thrown as expected');
                
                // Verify no tables were created
                elizaLogger.debug('Verifying rollback...');
                const { rows } = await testClient.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_name = 'rooms'
                    );
                `);
                expect(rows[0].exists).toBe(false);
                elizaLogger.success('Rollback verified successfully');
                spy.mockRestore();
            } catch (error) {
                elizaLogger.error(`Transaction rollback test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw error;
            }
        });
    });

    // Memory Operations tests will be updated in the next iteration
    describe('Memory Operations with Vector', () => {
        const TEST_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
        const TEST_TABLE = 'test_memories';
        
        beforeEach(async () => {
            elizaLogger.info('Setting up memory operations test...');
            try {
                // Ensure clean state and proper initialization
                await adapter.init();
                
                // Verify vector extension and search path
                await testClient.query(`
                    SET search_path TO public, extensions;
                    SELECT set_config('app.use_openai_embedding', 'true', false);
                `);
                
                // Create necessary account and room first
                await testClient.query('BEGIN');
                try {
                    await testClient.query(`
                        INSERT INTO accounts (id, email)
                        VALUES ($1, 'test@test.com')
                        ON CONFLICT (id) DO NOTHING
                    `, [TEST_UUID]);
                    
                    await testClient.query(`
                        INSERT INTO rooms (id)
                        VALUES ($1)
                        ON CONFLICT (id) DO NOTHING
                    `, [TEST_UUID]);
                    
                    await testClient.query('COMMIT');
                } catch (error) {
                    await testClient.query('ROLLBACK');
                    throw error;
                }
                
            } catch (error) {
                elizaLogger.error('Memory operations setup failed:', {
                    error: error instanceof Error ? error.message : String(error)
                });
                throw error;
            }
        });

        test('should create and retrieve memory with vector embedding', async () => {
            // Arrange
            const content: Content = {
                text: 'test content'
            };
            
            const memory: Memory = {
                id: TEST_UUID,
                content,
                embedding: new Array(1536).fill(0.1),
                unique: true,
                userId: TEST_UUID,
                agentId: TEST_UUID,
                roomId: TEST_UUID,
                createdAt: Date.now()
            };

            // Act
            await testClient.query('BEGIN');
            try {
                await adapter.createMemory(memory, TEST_TABLE);
                await testClient.query('COMMIT');
            } catch (error) {
                await testClient.query('ROLLBACK');
                throw error;
            }

            // Verify the embedding dimension
            const { rows: [{ get_embedding_dimension }] } = await testClient.query('SELECT get_embedding_dimension()');
            expect(get_embedding_dimension).toBe(1536);

            // Retrieve and verify
            const retrieved = await adapter.getMemoryById(TEST_UUID);
            expect(retrieved).toBeDefined();
            const parsedEmbedding = typeof retrieved?.embedding === 'string' ? parseVectorString(retrieved.embedding) : retrieved?.embedding;
            expect(Array.isArray(parsedEmbedding)).toBe(true);
            expect(parsedEmbedding).toHaveLength(1536);
            expect(retrieved?.content).toEqual(content);
        });

        test('should search memories by embedding', async () => {
            // Arrange
            const content: Content = { text: 'test content' };
            const embedding = new Array(1536).fill(0.1);
            const memory: Memory = {
                id: TEST_UUID,
                content,
                embedding,
                unique: true,
                userId: TEST_UUID,
                agentId: TEST_UUID,
                roomId: TEST_UUID,
                createdAt: Date.now()
            };

            // Create memory within transaction
            await testClient.query('BEGIN');
            try {
                await adapter.createMemory(memory, TEST_TABLE);
                await testClient.query('COMMIT');
            } catch (error) {
                await testClient.query('ROLLBACK');
                throw error;
            }
            
            // Act
            const results = await adapter.searchMemoriesByEmbedding(embedding, {
                tableName: TEST_TABLE,
                roomId: TEST_UUID,
                match_threshold: 0.8,
                count: 1
            });

            // Assert
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
            const parsedEmbedding = typeof results[0].embedding === 'string' ? parseVectorString(results[0].embedding) : results[0].embedding;
            expect(parsedEmbedding).toHaveLength(1536);
        });

        test('should handle invalid embedding dimensions', async () => {
            // Arrange
            const content: Content = {
                text: 'test content'
            };
            
            const memory: Memory = {
                id: TEST_UUID,
                content,
                embedding: new Array(100).fill(0.1), // Wrong dimension
                unique: true,
                userId: TEST_UUID,
                agentId: TEST_UUID,
                roomId: TEST_UUID,
                createdAt: Date.now()
            };

            // Act & Assert
            await testClient.query('BEGIN');
            try {
                await expect(adapter.createMemory(memory, TEST_TABLE))
                    .rejects
                    .toThrow('Invalid embedding dimension: expected 1536, got 100');
                await testClient.query('ROLLBACK');
            } catch (error) {
                await testClient.query('ROLLBACK');
                throw error;
            }
        }, { timeout: 30000 });  // Increased timeout for retry attempts
    });
}); 