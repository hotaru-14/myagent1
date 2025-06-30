const nextJest = require('next/jest')
const path = require('path')

// プロジェクトのルートディレクトリを設定
const projectRoot = path.resolve(__dirname, '../../../')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: projectRoot,
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  rootDir: projectRoot,
  setupFilesAfterEnv: ['<rootDir>/tests/10-todo-test/config/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/tests/10-todo-test/e2e/'],
  testMatch: ['<rootDir>/tests/10-todo-test/unit/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  // カバレッジ閾値: 10-todo-test専用（移行テストのため無効化）
  // coverageThreshold: {
  //   global: {
  //     branches: 10,
  //     functions: 10,
  //     lines: 10,
  //     statements: 10,
  //   },
  // },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 