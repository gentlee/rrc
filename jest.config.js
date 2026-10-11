/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['./src/testing/setup.ts'],
  testEnvironment: 'jsdom',
  // Used by `yarn test-coverage`. Library sources should stay fully covered.
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/__tests__/**', '!src/testing/**'],
  coverageThreshold: {
    global: {statements: 100, branches: 100, functions: 100, lines: 100},
  },
}
