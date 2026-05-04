/**
 * Feature: wutsup-foundation, Property 5: Client configuration validation identifies missing values
 *
 * For any non-empty subset of required environment variables that is removed
 * from the configuration source, the Client config loader SHALL throw an error
 * whose message contains the names of all missing variables.
 *
 * **Validates: Requirements 6.5**
 */

import * as fc from 'fast-check';

import { loadConfig } from '@/services/config';

const REQUIRED_ENV_VARS = [
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_LOG_LEVEL',
  'EXPO_PUBLIC_REMOTE_LOGGING_ENABLED',
  'EXPO_PUBLIC_ENVIRONMENT',
] as const;

const FULL_ENV: Record<string, string> = {
  EXPO_PUBLIC_API_BASE_URL: 'http://localhost:5000',
  EXPO_PUBLIC_LOG_LEVEL: 'debug',
  EXPO_PUBLIC_REMOTE_LOGGING_ENABLED: 'true',
  EXPO_PUBLIC_ENVIRONMENT: 'local',
};

/**
 * Generates a non-empty subset of the required env var names.
 * Uses fc.subarray with minLength 1 to guarantee at least one variable is removed.
 */
const nonEmptySubsetArb = fc.subarray([...REQUIRED_ENV_VARS], {
  minLength: 1,
  maxLength: REQUIRED_ENV_VARS.length,
});

function setFullEnv(): void {
  for (const [key, value] of Object.entries(FULL_ENV)) {
    process.env[key] = value;
  }
}

function clearEnv(): void {
  for (const key of REQUIRED_ENV_VARS) {
    delete process.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe('Property 5: Client configuration validation identifies missing values', () => {
  it('loadConfig() throws an error whose message contains all missing variable names for any non-empty subset removed', () => {
    fc.assert(
      fc.property(nonEmptySubsetArb, (removedVars) => {
        // Set all env vars to valid values
        setFullEnv();

        // Remove the selected subset
        for (const varName of removedVars) {
          delete process.env[varName];
        }

        // loadConfig should throw
        let thrownError: Error | undefined;
        try {
          loadConfig();
        } catch (e: unknown) {
          thrownError = e as Error;
        }

        // Must have thrown
        if (!thrownError) {
          return false;
        }

        const message = thrownError.message;

        // The error message must contain every removed variable name
        for (const varName of removedVars) {
          if (!message.includes(varName)) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 },
    );
  });
});
