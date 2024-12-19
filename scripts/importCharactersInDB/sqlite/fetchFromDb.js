import path from "path";
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

// Initialise better-sqlite3 Database instance
const db = new sqlite3(dbDir);

// Encryption utility instance
const encryptionUtil = new EncryptionUtil(
    process.env.ENCRYPTION_KEY || "default-key"
);

/**
 * Decrypts character secrets
 * @param {Object} encryptedSecrets - Encrypted secrets from characterState
 * @param {Object} secretsIV - IVs for each secret
 * @returns {Object} Decrypted secrets
 */
function decryptSecrets(encryptedSecrets, secretsIV) {
    if (!encryptedSecrets || !secretsIV) return {};

    const decryptedSecrets = {};
    for (const [key, encryptedValue] of Object.entries(encryptedSecrets)) {
        try {
            const iv = secretsIV[key];
            if (!iv) {
                console.error(`Missing IV for secret ${key}`);
                continue;
            }

            const decrypted = encryptionUtil.decrypt({
                encryptedText: encryptedValue,
                iv: iv,
            });
            decryptedSecrets[key] = decrypted;
        } catch (error) {
            console.error(`Failed to decrypt secret ${key}:`, error.message);
        }
    }
    return decryptedSecrets;
}

/**
 * Fetches and displays all characters
 * Handles:
 * - Database query
 * - Pretty printing of character data
 * - Secret decryption and display
 * - Error handling
 */
function fetchCharacters() {
    try {
        const rows = db.prepare("SELECT * FROM characters ORDER BY name").all();

        for (const row of rows) {
            console.log("\n=== Character ===");
            console.log("ID:", row.id);
            console.log("Name:", row.name);

            // Parse character state and secretsIV
            const characterState = JSON.parse(row.characterState);
            const secretsIV = JSON.parse(row.secretsIV);

            // Decrypt secrets if they exist
            if (
                characterState.settings?.secrets &&
                Object.keys(characterState.settings.secrets).length > 0
            ) {
                const decryptedSecrets = decryptSecrets(
                    characterState.settings.secrets,
                    secretsIV
                );
                // Replace encrypted secrets with decrypted ones for display
                characterState.settings.secrets = decryptedSecrets;
            }

            // Pretty print character state with decrypted secrets
            console.log("\nCharacter State:");
            console.log(JSON.stringify(characterState, null, 2));

            console.log("\nCreated At:", row.createdAt);
            console.log("Updated At:", row.updatedAt);
            console.log("==================\n");
        }

        console.log(`Total characters: ${rows.length}`);
    } catch (error) {
        console.error("Error fetching characters:", error);
    }
}

// Main execution
try {
    console.log("Starting fetch operation...");
    fetchCharacters();
} catch (error) {
    console.error("Failed to process:", error);
    process.exit(1);
}
