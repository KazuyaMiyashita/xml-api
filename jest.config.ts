import type { Config } from 'jest';

const config: Config = {

  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  testMatch: [
    '<rootDir>/src/**/*.test.ts'
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/worktrees/'
  ],
};

export default config;
