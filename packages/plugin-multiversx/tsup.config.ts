import { defineConfig } from "tsup";
import { polyfillNode } from "esbuild-plugin-polyfill-node";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,
    format: ["esm"], // Ensure you're targeting CommonJS
    external: [
        "dotenv", // Externalize dotenv to prevent bundling
        "@reflink/reflink",
        "@node-llama-cpp",
        "agentkeepalive",
        "zod",
        "zlib",
        // Add other modules you want to externalize
    ],
    esbuildPlugins: [polyfillNode()],
});
