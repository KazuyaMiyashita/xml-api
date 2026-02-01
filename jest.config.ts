import type { Config } from "jest";

const config: Config = {
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },

  testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/tests/**/*.spec.ts", "<rootDir>/demo/**/*.test.ts"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/worktrees/"],
};

export default config;
