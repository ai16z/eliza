import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,
    format: ["esm"],
    external: [
        "dotenv",
        "fs",
        "path",
        "process",
        "@reflink/reflink",
        "@node-llama-cpp",
        "@fal-ai/client",
        "https",
        "http",
        "agentkeepalive",
    ],
});
