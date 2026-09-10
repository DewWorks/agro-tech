import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Carrega o ambiente Next.js, .env e compilação SWC nativa
  dir: './',
})

/** @type {import('jest').Config} */
const customJestConfig = {
  coverageProvider: 'v8',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(@faker-js/faker)/)',
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
}

export default createJestConfig(customJestConfig)
