/**
 * Character Database Insertion Script
 *
 * This script reads character JSON files and inserts them into a PostgreSQL database.
 * It handles both single files and directories of JSON files.
 * Features:
 * - Validates JSON against a Zod schema
 * - Encrypts sensitive data (secrets) before storage
 * - Generates deterministic UUIDs from character names
 * - Stores character state and encrypted secrets separately
 * - Supports upsert operations (update if exists)
 *
 * Usage:
 * Requires environment variables:
 * - POSTGRES_URL: PostgreSQL connection string
 * - ENCRYPTION_KEY: Key for encrypting secrets
 * - INPUT_PATH: Path to JSON file or directory
 */

const fs = require("fs").promises;
const path = require("path");
const { z } = require("zod");
const { Pool } = require("pg");
const EncryptionUtil = require("../crypt");
require("dotenv").config();

// Zod schema for validating character JSON structure
const CharacterSchema = z.object({
    name: z.string(),
    username: z.string().optional(),
    system: z.string().optional(),
    modelProvider: z.string(),
    modelEndpointOverride: z.string().optional(),
    bio: z.union([z.string(), z.array(z.string())]),
    lore: z.array(z.string()),
    messageExamples: z.array(z.array(z.any())),
    postExamples: z.array(z.string()),
    people: z.array(z.string()),
    topics: z.array(z.string()),
    adjectives: z.array(z.string()),
    knowledge: z.array(z.string()).optional(),
    clients: z.array(z.string()),
    plugins: z.array(z.string()),
    settings: z
        .object({
            secrets: z.record(z.string()).optional(),
            voice: z
                .object({
                    model: z.string().optional(),
                    url: z.string().optional(),
                })
                .optional(),
        })
        .optional(),
    style: z.object({
        all: z.array(z.string()),
        chat: z.array(z.string()),
        post: z.array(z.string()),
    }),
});

// Database connection pool
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

// Encryption utility instance
const encryptionUtil = new EncryptionUtil(
    process.env.ENCRYPTION_KEY || "default-key"
);

/**
 * Tests database connection
 * Exits process if connection fails
 */
async function testConnection() {
    const client = await pool.connect();
    try {
        await client.query("SELECT NOW()");
        console.log("Database connection successful");
    } catch (error) {
        console.error("Failed to connect to database:", error.message);
        process.exit(1);
    } finally {
        client.release();
    }
}

/**
 * Inserts or updates a character in the database
 * @param {Object} character - Validated character object
 * Handles:
 * - UUID generation
 * - Secret encryption with separate IV storage
 * - Character state preparation with encrypted secrets
 * - Transaction management
 */
async function insertCharacter(character) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Generate UUID from name
        const id = encryptionUtil.stringToUuid(character.name);

        // Extract and encrypt secrets if they exist
        let secretsIV = {};
        let characterState = { ...character };

        if (character.settings?.secrets) {
            const secretEntries = Object.entries(character.settings.secrets);
            characterState.settings = {
                ...character.settings,
                secrets: {},
            };

            for (const [key, value] of secretEntries) {
                const encrypted = encryptionUtil.encrypt(value);
                characterState.settings.secrets[key] = encrypted.encryptedText;
                secretsIV[key] = encrypted.iv;
            }
        }

        const query = `
            INSERT INTO characters (
                id,
                name,
                "characterState",
                "secretsIV",
                "createdAt",
                "updatedAt"
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
                "characterState" = EXCLUDED."characterState",
                "secretsIV" = EXCLUDED."secretsIV",
                "updatedAt" = NOW()
        `;

        await client.query(query, [
            id,
            character.name,
            characterState,
            secretsIV,
        ]);

        await client.query("COMMIT");
        console.log(`Successfully imported character: ${character.name}`);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(`Error importing character ${character.name}:`, error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Processes a single JSON file
 * @param {string} filePath - Path to JSON file
 * Handles:
 * - File reading
 * - JSON parsing
 * - Schema validation
 * - Character insertion
 */
async function processJsonFile(filePath) {
    try {
        const content = await fs.readFile(filePath, "utf8");
        const character = JSON.parse(content);

        // Validate against schema
        const validatedCharacter = CharacterSchema.parse(character);

        await insertCharacter(validatedCharacter);
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
    }
}

/**
 * Processes input path (file or directory)
 * @param {string} inputPath - Path to process
 * Handles both single JSON files and directories
 */
async function processPath(inputPath) {
    try {
        const stats = await fs.stat(inputPath);

        if (stats.isDirectory()) {
            const files = await fs.readdir(inputPath);
            for (const file of files) {
                if (file.endsWith(".json")) {
                    await processJsonFile(path.join(inputPath, file));
                }
            }
        } else if (stats.isFile() && inputPath.endsWith(".json")) {
            await processJsonFile(inputPath);
        }
    } catch (error) {
        console.error("Error processing path:", error);
    }
}

// Usage
const inputPath = process.env.INPUT_PATH;
if (!inputPath) {
    console.error("Please provide a path to a JSON file or directory");
    process.exit(1);
}
console.log(inputPath);

testConnection()
    .then(() => {
        console.log("Successful Connection");
        return processPath(inputPath);
    })
    .catch((error) => {
        console.error("Failed to process:", error);
        process.exit(1);
    })
    .finally(() => {
        pool.end();
    });
