export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ClientConfig {
  apiBaseUrl: string;
  logLevel: LogLevel;
  remoteLoggingEnabled: boolean;
  environment: 'local' | 'qa' | 'staging' | 'production';
}

const VALID_LOG_LEVELS: readonly string[] = ['debug', 'info', 'warn', 'error'];
const VALID_ENVIRONMENTS: readonly string[] = ['local', 'qa', 'staging', 'production'];

interface EnvVarMapping {
  envVar: string;
  key: keyof ClientConfig;
}

const REQUIRED_ENV_VARS: readonly EnvVarMapping[] = [
  { envVar: 'API_BASE_URL', key: 'apiBaseUrl' },
  { envVar: 'LOG_LEVEL', key: 'logLevel' },
  { envVar: 'REMOTE_LOGGING_ENABLED', key: 'remoteLoggingEnabled' },
  { envVar: 'ENVIRONMENT', key: 'environment' },
];

/**
 * Reads a single environment variable from process.env.
 * Returns undefined if the variable is not set or is an empty string.
 */
function getEnvVar(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return undefined;
  }
  return value;
}

/**
 * Loads and validates client configuration from environment variables.
 *
 * Required environment variables:
 * - API_BASE_URL
 * - LOG_LEVEL
 * - REMOTE_LOGGING_ENABLED
 * - ENVIRONMENT
 *
 * Throws a descriptive error listing ALL missing variable names if any are absent.
 */
export function loadConfig(): ClientConfig {
  const missing: string[] = [];

  for (const { envVar } of REQUIRED_ENV_VARS) {
    if (getEnvVar(envVar) === undefined) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  const rawLogLevel = getEnvVar('LOG_LEVEL')!.toLowerCase();
  const logLevel: LogLevel = VALID_LOG_LEVELS.includes(rawLogLevel)
    ? (rawLogLevel as LogLevel)
    : 'info';

  const rawEnvironment = getEnvVar('ENVIRONMENT')!.toLowerCase();
  const environment: ClientConfig['environment'] = VALID_ENVIRONMENTS.includes(rawEnvironment)
    ? (rawEnvironment as ClientConfig['environment'])
    : 'local';

  const rawRemoteLogging = getEnvVar('REMOTE_LOGGING_ENABLED')!.toLowerCase();
  const remoteLoggingEnabled = rawRemoteLogging === 'true';

  return {
    apiBaseUrl: getEnvVar('API_BASE_URL')!,
    logLevel,
    remoteLoggingEnabled,
    environment,
  };
}
