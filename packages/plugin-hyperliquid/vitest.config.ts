import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 30000, // 30 seconds for integration tests
        hookTimeout: 30000,
        include: ['test/**/*.test.ts'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['test/**/*.ts']
        }
    }
});