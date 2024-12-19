/**
 * Character Database Fetch Script
 *
 * This script retrieves and displays character data from PostgreSQL database.
 * Features:
 * - Fetches all characters
 * - Decrypts stored secrets using separate IVs
 * - Pretty prints character data and decrypted secrets
 * - Displays creation and update timestamps
 *
 * Usage:
 * Requires environment variables:
 * - POSTGRES_URL: PostgreSQL connection string
 * - ENCRYPTION_KEY: Key for decrypting secrets
 */

const { Pool } = require("pg");
const EncryptionUtil = require("../crypt");
require("dotenv").config();

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
 * Decrypts character secrets
 * @param {Object} encryptedSecrets - Encrypted secrets from characterState
 * @param {Object} secretsIV - IVs for each secret
 * @returns {Object} Decrypted secrets
 */
async function decryptSecrets(encryptedSecrets, secretsIV) {
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
async function fetchCharacters() {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT * FROM characters ORDER BY "name"'
        );

        for (const row of result.rows) {
            console.log("\n=== Character ===");
            console.log("ID:", row.id);
            console.log("Name:", row.name);

            // Create a copy of character state for display
            const displayState = JSON.parse(JSON.stringify(row.characterState));

            // Decrypt secrets if they exist
            if (
                displayState.settings?.secrets &&
                Object.keys(displayState.settings.secrets).length > 0
            ) {
                const decryptedSecrets = await decryptSecrets(
                    displayState.settings.secrets,
                    row.secretsIV
                );
                // Replace encrypted secrets with decrypted ones for display
                displayState.settings.secrets = decryptedSecrets;
            }

            // Pretty print character state with decrypted secrets
            console.log("\nCharacter State:");
            console.log(JSON.stringify(displayState, null, 2));

            console.log("\nCreated At:", row.createdAt);
            console.log("Updated At:", row.updatedAt);
            console.log("==================\n");
        }

        console.log(`Total characters: ${result.rows.length}`);
    } catch (error) {
        console.error("Error fetching characters:", error);
    } finally {
        client.release();
    }
}

// Main execution
testConnection()
    .then(async () => {
        console.log("Starting fetch operation...");
        await fetchCharacters();
    })
    .catch((error) => {
        console.error("Failed to process:", error);
        process.exit(1);
    })
    .finally(() => {
        pool.end();
    });
