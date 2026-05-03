export interface AdminConfig {
  apiBaseUrl: string;
}

/**
 * Loads and validates the Admin Portal configuration from environment variables.
 * Throws a descriptive error if any required variable is missing or empty.
 */
export function loadConfig(): AdminConfig {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!apiBaseUrl || apiBaseUrl.trim() === '') {
    throw new Error(
      'Missing required environment variable: VITE_API_BASE_URL. ' +
      'Set VITE_API_BASE_URL in your .env.local (development) or .env.production (production) file.'
    );
  }

  return { apiBaseUrl };
}
