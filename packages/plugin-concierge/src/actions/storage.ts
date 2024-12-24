import path from "path";
import fs from "fs";
import { elizaLogger } from "@ai16z/eliza";

export class LocalStorage {
    private baseDir: string;

    constructor(baseDir: string = ".data/wallets") {
        if (process.env.RAILWAY_VOLUME_MOUNT_PATH !== undefined) {
            this.baseDir = path.join(
                process.env.RAILWAY_VOLUME_MOUNT_PATH as string,
                baseDir
            );
            if (process.env.MSG_LOG === "true")
                elizaLogger.info(
                    "Railway detected - Using absolute path:",
                    this.baseDir
                );
        } else {
            this.baseDir = path.join(process.cwd(), baseDir);
            //if (process.env.MSG_LOG === "true")
            //elizaLogger.info("Local development - Using relative path:", this.baseDir);
        }
    }

    private async ensureDir(): Promise<boolean> {
        if (!fs) {
            console.error("Filesystem not available");
            throw new Error("Filesystem is not available");
        }

        try {
            if (!fs?.existsSync(this.baseDir)) {
                fs.mkdirSync(this.baseDir, {
                    recursive: true,
                    mode: 0o755,
                });
            }
            return true;
        } catch (error) {
            console.error("Storage directory error:", error);
            throw new Error(`Failed to create/write to directory: ${error}`);
        }
    }

    async set(key: string, value: string): Promise<void> {
        const ensureDir = await this.ensureDir();
        if (!ensureDir) {
            throw new Error(
                "Failed to ensure directory - filesystem may not be available"
            );
        }

        try {
            const filePath = path.join(
                this.baseDir,
                `${key.toLowerCase()}.dat`
            );
            fs.writeFileSync(filePath, value, "utf8");
        } catch (error) {
            throw new Error(`Failed to write file: ${error}`);
        }
    }

    async get(key: string): Promise<string | undefined> {
        try {
            const filePath = path.join(
                this.baseDir,
                `${key.toLowerCase()}.dat`
            );
            return fs.readFileSync(filePath, "utf8") ?? undefined;
        } catch (error) {
            elizaLogger.info("Error reading file:", error);
            return undefined;
        }
    }

    async del(key: string): Promise<void> {
        try {
            const filePath = path.join(
                this.baseDir,
                `${key.toLowerCase()}.dat`
            );
            fs.unlinkSync(filePath);
        } catch (error) {
            elizaLogger.info("Error deleting file:", error);
        }
    }

    async getWalletCount(): Promise<number> {
        try {
            const walletFiles = fs.readdirSync(this.baseDir);
            return walletFiles?.length || 0;
        } catch (error) {
            elizaLogger.info("Error reading directory:", this.baseDir, error);
            return 0;
        }
    }
}
