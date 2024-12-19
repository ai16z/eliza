import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { fileURLToPath } from "url";
import sqlite3 from "better-sqlite3"; // Use default export for better-sqlite3
import EncryptionUtil from "../crypt.js"; // Ensure this file is available
import dotenv from "dotenv";

dotenv.config();

// Get __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "../../../agent/data");

// Define SQLite database path
const dbDir = process.env.SQLITE_DB_PATH || path.join(dataDir, "db.sqlite");

// Ensure the database directory exists
const dbPath = path.dirname(dbDir); // Extract the directory portion of dbDir
await fs.mkdir(dbPath, { recursive: true }); // Create directory if it doesn't exist

// Initialise better-sqlite3 Database instance
const db = new sqlite3(dbDir);

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

// Encryption utility instance
const encryptionUtil = new EncryptionUtil(
    process.env.ENCRYPTION_KEY || "default-key"
);

/**
 * Initialise SQLite database
 */
function initDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS characters (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            characterState TEXT NOT NULL,
            secretsIV TEXT NOT NULL,
            createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("Database initialised at:", dbDir);
}

/**
 * Inserts or updates a character in the SQLite database
 * @param {Object} character - Validated character object
 */
function insertCharacter(character) {
    try {
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

        // Upsert query using better-sqlite3
        const query = `
            INSERT INTO characters (id, name, characterState, secretsIV, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
                characterState = excluded.characterState,
                secretsIV = excluded.secretsIV,
                updatedAt = datetime('now')
        `;

        db.prepare(query).run(
            id,
            character.name,
            JSON.stringify(characterState),
            JSON.stringify(secretsIV)
        );

        console.log(`Successfully imported character: ${character.name}`);
    } catch (error) {
        console.error(`Error importing character ${character.name}:`, error);
        throw error;
    }
}

/**
 * Processes a single JSON file
 * @param {string} filePath - Path to JSON file
 */
async function processJsonFile(filePath) {
    try {
        const content = await fs.readFile(filePath, "utf8");
        const character = JSON.parse(content);

        // Validate against schema
        const validatedCharacter = CharacterSchema.parse(character);

        insertCharacter(validatedCharacter);
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
    }
}

/**
 * Processes input path (file or directory)
 * @param {string} inputPath - Path to process
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

// Main Usage
const inputPath = process.env.INPUT_PATH;
if (!inputPath) {
    console.error("Please provide a path to a JSON file or directory");
    process.exit(1);
}

initDatabase();

processPath(inputPath).catch((error) => {
    console.error("Failed to process:", error);
    process.exit(1);
});
