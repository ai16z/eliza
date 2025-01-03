import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,
    format: ["esm"], // Ensure you're targeting CommonJS
    external: [
        "@injective-labs/sdk-ts",
        "injective-sdk-client-ts",
        "axios",
        "bignumber.js"
    ],
});
