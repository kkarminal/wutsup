import { loadConfig } from './config';

import type { ClientConfig } from './config';

const FULL_ENV = {
  API_BASE_URL: 'http://localhost:5000',
  LOG_LEVEL: 'debug',
  REMOTE_LOGGING_ENABLED: 'true',
  ENVIRONMENT: 'local',
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
      expect(msg).toContain('API_BASE_URL');
      expect(msg).toContain('LOG_LEVEL');
      expect(msg).toContain('REMOTE_LOGGING_ENABLED');
      expect(msg).toContain('ENVIRONMENT');
    }
  });

  it('throws listing only the missing variable when one is absent', () => {
    setEnv();
    delete process.env.API_BASE_URL;

    expect(() => loadConfig()).toThrow('API_BASE_URL');
    try {
      loadConfig();
    } catch (e: unknown) {
      const msg = (e as Error).message;
      expect(msg).toContain('API_BASE_URL');
      expect(msg).not.toContain('LOG_LEVEL');
    }
  });

  it('treats empty string as missing', () => {
    setEnv({ API_BASE_URL: '' });

    expect(() => loadConfig()).toThrow('API_BASE_URL');
  });

  it('parses REMOTE_LOGGING_ENABLED=false correctly', () => {
    setEnv({ REMOTE_LOGGING_ENABLED: 'false' });
    const config = loadConfig();
    expect(config.remoteLoggingEnabled).toBe(false);
  });

  it('defaults to info when LOG_LEVEL is invalid', () => {
    setEnv({ LOG_LEVEL: 'verbose' });
    const config = loadConfig();
    expect(config.logLevel).toBe('info');
  });

  it('handles case-insensitive LOG_LEVEL', () => {
    setEnv({ LOG_LEVEL: 'WARN' });
    const config = loadConfig();
    expect(config.logLevel).toBe('warn');
  });

  it('handles case-insensitive ENVIRONMENT', () => {
    setEnv({ ENVIRONMENT: 'Production' });
    const config = loadConfig();
    expect(config.environment).toBe('production');
  });
});
