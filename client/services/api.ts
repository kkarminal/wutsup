import type { LogEntry } from './logger';

export interface ApiClient {
  sendLogEntry(entry: LogEntry): Promise<boolean>;
}

/**
 * Creates an HTTP client configured with the given API base URL.
 *
 * - `sendLogEntry` POSTs a log entry to `{apiBaseUrl}/api/logs`.
 * - Returns `true` on success, `false` on any network or server error.
 * - Never throws — callers can safely fire-and-forget.
 */
export function createApiClient(apiBaseUrl: string): ApiClient {
  return {
    async sendLogEntry(entry: LogEntry): Promise<boolean> {
      try {
        const response = await fetch(`${apiBaseUrl}/api/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        return response.ok;
      } catch {
        return false;
      }
    },
  };
}
