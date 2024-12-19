// js version of the EncryptionUtil class in core/src/crypt.ts
// also added stringToUuid function
const crypto = require("crypto");
const sha1 = require("js-sha1");

class EncryptionUtil {
    constructor(secretKey) {
        this.algorithm = "aes-256-cbc";
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

    encrypt(data) {
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

    decrypt(data) {
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
            throw new Error("Decryption failed: " + error.message);
        }
    }

    stringToUuid(target) {
        if (typeof target === "number") {
            target = target.toString();
        }

        if (typeof target !== "string") {
            throw TypeError("Value must be string");
        }

        const _uint8ToHex = (ubyte) => {
            const first = ubyte >> 4;
            const second = ubyte - (first << 4);
            const HEX_DIGITS = "0123456789abcdef".split("");
            return HEX_DIGITS[first] + HEX_DIGITS[second];
        };

        const _uint8ArrayToHex = (buf) => {
            let out = "";
            for (let i = 0; i < buf.length; i++) {
                out += _uint8ToHex(buf[i]);
            }
            return out;
        };

        const escapedStr = encodeURIComponent(target);
        const buffer = new Uint8Array(escapedStr.length);
        for (let i = 0; i < escapedStr.length; i++) {
            buffer[i] = escapedStr[i].charCodeAt(0);
        }

        const hash = sha1(buffer);
        const hashBuffer = new Uint8Array(hash.length / 2);
        for (let i = 0; i < hash.length; i += 2) {
            hashBuffer[i / 2] = parseInt(hash.slice(i, i + 2), 16);
        }

        return (
            _uint8ArrayToHex(hashBuffer.slice(0, 4)) +
            "-" +
            _uint8ArrayToHex(hashBuffer.slice(4, 6)) +
            "-" +
            _uint8ToHex(hashBuffer[6] & 0x0f) +
            _uint8ToHex(hashBuffer[7]) +
            "-" +
            _uint8ToHex((hashBuffer[8] & 0x3f) | 0x80) +
            _uint8ToHex(hashBuffer[9]) +
            "-" +
            _uint8ArrayToHex(hashBuffer.slice(10, 16))
        );
    }
}

module.exports = EncryptionUtil;
