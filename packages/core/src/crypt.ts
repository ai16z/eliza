import crypto from "crypto";

export interface EncryptedData {
    encryptedText: string;
    iv: string;
}

export class EncryptionUtil {
    private readonly algorithm = "aes-256-cbc";
    private readonly key: Buffer;

    constructor(secretKey: string) {
        // Create a 32-byte key using SHA-512 hash of the secret key
        this.key = Buffer.from(
            crypto
                .createHash("sha512")
                .update(secretKey)
                .digest("hex")
                .substring(0, 32),
            "utf8"
        );
    }

    encrypt(data: string): EncryptedData {
        // Generate a random IV for each encryption
        const iv = crypto.randomBytes(16);

        // Create cipher with key and iv
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        // Encrypt the data
        let encrypted = cipher.update(data, "utf8", "hex");
        encrypted += cipher.final("hex");

        // Return both the encrypted data and iv
        return {
            encryptedText: encrypted,
            iv: iv.toString("hex"),
        };
    }

    decrypt(data: EncryptedData): string {
        try {
            // Convert IV back to Buffer
            const iv = Buffer.from(data.iv, "hex");

            // Create decipher
            const decipher = crypto.createDecipheriv(
                this.algorithm,
                this.key,
                iv
            );

            // Decrypt the data
            let decrypted = decipher.update(data.encryptedText, "hex", "utf8");
            decrypted += decipher.final("utf8");

            return decrypted;
        } catch (error) {
            throw new Error("Decryption failed: " + (error as Error).message);
        }
    }
}
