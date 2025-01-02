/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ["<rootDir>/src/tests/**/*.test.ts"],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@elizaos/core$': '<rootDir>/src/tests/__mocks__/core.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json'
    }]
  },
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts']
};

export default config;
