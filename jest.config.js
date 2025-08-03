module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.svg$': '<rootDir>/tests/__mocks__/svgTransform.js'
  },
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.test.js'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/vendor/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/__mocks__/**',
    '!**/public/**',
    '!**/build/**',
    '!**/dist/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  testURL: 'http://localhost:3000',
  globals: {
    __DEV__: true,
    __TEST__: true
  }
};
