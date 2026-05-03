/**
 * Feature: wutsup-foundation, Property 1: Client log entries contain required metadata
 *
 * For any valid log level and any non-empty source string, the formatted log
 * entry produced by the Client Logger SHALL contain a valid ISO 8601 timestamp,
 * the log level, and the source identifier.
 *
 * **Validates: Requirements 4.5**
 */

import * as fc from 'fast-check';

import { createLogEntry } from '@/services/logger';
import type { LogEntry } from '@/services/logger';

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

/**
 * ISO 8601 timestamp pattern matching the output of Date.toISOString().
 * Format: YYYY-MM-DDTHH:mm:ss.sssZ
 */
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * Generates one of the four valid log levels.
 */
const logLevelArb = fc.constantFrom(...LOG_LEVELS);

/**
 * Generates a non-empty source string (at least 1 character).
 */
const nonEmptySourceArb = fc.string({ minLength: 1 });

/**
 * Generates an arbitrary message string (may be empty).
 */
const messageArb = fc.string();

describe('Property 1: Client log entries contain required metadata', () => {
  it('createLogEntry() produces an entry with a valid ISO 8601 timestamp, the log level, and the source identifier', () => {
    fc.assert(
      fc.property(logLevelArb, nonEmptySourceArb, messageArb, (level, source, message) => {
        const entry: LogEntry = createLogEntry(level, source, message);

        // Timestamp must be a valid ISO 8601 string
        if (!ISO_8601_REGEX.test(entry.timestamp)) {
          return false;
        }

        // Parsing the timestamp must produce a valid date
        const parsed = new Date(entry.timestamp);
        if (isNaN(parsed.getTime())) {
          return false;
        }

        // Level must match the input level
        if (entry.level !== level) {
          return false;
        }

        // Source must match the input source
        if (entry.source !== source) {
          return false;
        }

        return true;
      }),
      { numRuns: 100 },
    );
  });
});
