import { loadConfig } from './config';

import type { ClientConfig } from './config';

const FULL_ENV = {
  EXPO_PUBLIC_API_BASE_URL: 'http://localhost:5000',
  EXPO_PUBLIC_LOG_LEVEL: 'debug',
  EXPO_PUBLIC_REMOTE_LOGGING_ENABLED: 'true',
  EXPO_PUBLIC_ENVIRONMENT: 'local',
};

function setEnv(overrides: Partial<Record<string, string>> = {}): void {
  const env = { ...FULL_ENV, ...overrides };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function clearEnv(): void {
  for (const key of Object.keys(FULL_ENV)) {
    delete process.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe('loadConfig', () => {
  it('returns a valid ClientConfig when all env vars are set', () => {
    setEnv();
    const config: ClientConfig = loadConfig();

    expect(config).toEqual({
      apiBaseUrl: 'http://localhost:5000',
      logLevel: 'debug',
      remoteLoggingEnabled: true,
      environment: 'local',
    });
  });

  it('throws when all env vars are missing', () => {
    expect(() => loadConfig()).toThrow('Missing required environment variables');
    try {
      loadConfig();
    } catch (e: unknown) {
      const msg = (e as Error).message;
      expect(msg).toContain('EXPO_PUBLIC_API_BASE_URL');
      expect(msg).toContain('EXPO_PUBLIC_LOG_LEVEL');
      expect(msg).toContain('EXPO_PUBLIC_REMOTE_LOGGING_ENABLED');
      expect(msg).toContain('EXPO_PUBLIC_ENVIRONMENT');
    }
  });

  it('throws listing only the missing variable when one is absent', () => {
    setEnv();
    delete process.env.EXPO_PUBLIC_API_BASE_URL;

    expect(() => loadConfig()).toThrow('EXPO_PUBLIC_API_BASE_URL');
    try {
      loadConfig();
    } catch (e: unknown) {
      const msg = (e as Error).message;
      expect(msg).toContain('EXPO_PUBLIC_API_BASE_URL');
      expect(msg).not.toContain('EXPO_PUBLIC_LOG_LEVEL');
    }
  });

  it('treats empty string as missing', () => {
    setEnv({ EXPO_PUBLIC_API_BASE_URL: '' });

    expect(() => loadConfig()).toThrow('EXPO_PUBLIC_API_BASE_URL');
  });

  it('parses EXPO_PUBLIC_REMOTE_LOGGING_ENABLED=false correctly', () => {
    setEnv({ EXPO_PUBLIC_REMOTE_LOGGING_ENABLED: 'false' });
    const config = loadConfig();
    expect(config.remoteLoggingEnabled).toBe(false);
  });

  it('defaults to info when EXPO_PUBLIC_LOG_LEVEL is invalid', () => {
    setEnv({ EXPO_PUBLIC_LOG_LEVEL: 'verbose' });
    const config = loadConfig();
    expect(config.logLevel).toBe('info');
  });

  it('handles case-insensitive EXPO_PUBLIC_LOG_LEVEL', () => {
    setEnv({ EXPO_PUBLIC_LOG_LEVEL: 'WARN' });
    const config = loadConfig();
    expect(config.logLevel).toBe('warn');
  });

  it('handles case-insensitive EXPO_PUBLIC_ENVIRONMENT', () => {
    setEnv({ EXPO_PUBLIC_ENVIRONMENT: 'Production' });
    const config = loadConfig();
    expect(config.environment).toBe('production');
  });
});
