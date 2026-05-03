import { createLogEntry, createLogger } from './logger';

import type { LogEntry, Logger, LoggerConfig } from './logger';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

function makeConfig(overrides: Partial<LoggerConfig> = {}): LoggerConfig {
  return {
    remoteLoggingEnabled: false,
    apiBaseUrl: 'http://localhost:5000',
    minLevel: 'debug',
    ...overrides,
  };
}

// ── createLogEntry ───────────────────────────────────────────────────────────

describe('createLogEntry', () => {
  it('includes an ISO 8601 timestamp', () => {
    const entry = createLogEntry('info', 'TestSource', 'hello');
    expect(entry.timestamp).toMatch(ISO_8601_REGEX);
  });

  it('includes the log level', () => {
    const entry = createLogEntry('warn', 'TestSource', 'warning message');
    expect(entry.level).toBe('warn');
  });

  it('includes the source identifier', () => {
    const entry = createLogEntry('error', 'MyComponent', 'something broke');
    expect(entry.source).toBe('MyComponent');
  });

  it('includes the message', () => {
    const entry = createLogEntry('debug', 'Src', 'debug msg');
    expect(entry.message).toBe('debug msg');
  });
});

// ── createLogger — console output ────────────────────────────────────────────

describe('createLogger — console output', () => {
  let spyDebug: jest.SpyInstance;
  let spyInfo: jest.SpyInstance;
  let spyWarn: jest.SpyInstance;
  let spyError: jest.SpyInstance;

  beforeEach(() => {
    spyDebug = jest.spyOn(console, 'debug').mockImplementation();
    spyInfo = jest.spyOn(console, 'info').mockImplementation();
    spyWarn = jest.spyOn(console, 'warn').mockImplementation();
    spyError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes debug messages to console.debug', () => {
    const logger = createLogger(makeConfig());
    logger.debug('Src', 'dbg');
    expect(spyDebug).toHaveBeenCalledTimes(1);
  });

  it('writes info messages to console.info', () => {
    const logger = createLogger(makeConfig());
    logger.info('Src', 'inf');
    expect(spyInfo).toHaveBeenCalledTimes(1);
  });

  it('writes warn messages to console.warn', () => {
    const logger = createLogger(makeConfig());
    logger.warn('Src', 'wrn');
    expect(spyWarn).toHaveBeenCalledTimes(1);
  });

  it('writes error messages to console.error', () => {
    const logger = createLogger(makeConfig());
    logger.error('Src', 'err');
    expect(spyError).toHaveBeenCalledTimes(1);
  });

  it('formats output as [timestamp] [LEVEL] [source] message', () => {
    const logger = createLogger(makeConfig());
    logger.info('App', 'started');

    const output: string = spyInfo.mock.calls[0][0];
    expect(output).toMatch(/^\[.+\] \[INFO\] \[App\] started$/);
  });
});

// ── createLogger — minLevel filtering ────────────────────────────────────────

describe('createLogger — minLevel filtering', () => {
  let spyDebug: jest.SpyInstance;
  let spyInfo: jest.SpyInstance;
  let spyWarn: jest.SpyInstance;
  let spyError: jest.SpyInstance;

  beforeEach(() => {
    spyDebug = jest.spyOn(console, 'debug').mockImplementation();
    spyInfo = jest.spyOn(console, 'info').mockImplementation();
    spyWarn = jest.spyOn(console, 'warn').mockImplementation();
    spyError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('suppresses debug when minLevel is info', () => {
    const logger = createLogger(makeConfig({ minLevel: 'info' }));
    logger.debug('Src', 'msg');
    expect(spyDebug).not.toHaveBeenCalled();
  });

  it('allows warn when minLevel is info', () => {
    const logger = createLogger(makeConfig({ minLevel: 'info' }));
    logger.warn('Src', 'msg');
    expect(spyWarn).toHaveBeenCalledTimes(1);
  });

  it('suppresses info and debug when minLevel is warn', () => {
    const logger = createLogger(makeConfig({ minLevel: 'warn' }));
    logger.debug('Src', 'msg');
    logger.info('Src', 'msg');
    expect(spyDebug).not.toHaveBeenCalled();
    expect(spyInfo).not.toHaveBeenCalled();
  });

  it('only allows error when minLevel is error', () => {
    const logger = createLogger(makeConfig({ minLevel: 'error' }));
    logger.debug('Src', 'msg');
    logger.info('Src', 'msg');
    logger.warn('Src', 'msg');
    logger.error('Src', 'msg');
    expect(spyDebug).not.toHaveBeenCalled();
    expect(spyInfo).not.toHaveBeenCalled();
    expect(spyWarn).not.toHaveBeenCalled();
    expect(spyError).toHaveBeenCalledTimes(1);
  });
});

// ── createLogger — remote logging ────────────────────────────────────────────

describe('createLogger — remote logging', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends entries via HTTP POST when remote logging is enabled', () => {
    const logger = createLogger(makeConfig({ remoteLoggingEnabled: true }));
    logger.info('Src', 'remote msg');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('http://localhost:5000/api/logs');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });

    const body: LogEntry = JSON.parse(options.body);
    expect(body.level).toBe('info');
    expect(body.source).toBe('Src');
    expect(body.message).toBe('remote msg');
    expect(body.timestamp).toMatch(ISO_8601_REGEX);
  });

  it('does not call fetch when remote logging is disabled', () => {
    const logger = createLogger(makeConfig({ remoteLoggingEnabled: false }));
    logger.info('Src', 'local only');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('silently falls back to console when fetch rejects', () => {
    fetchSpy.mockRejectedValue(new Error('network error'));
    const logger = createLogger(makeConfig({ remoteLoggingEnabled: true }));

    // Should not throw
    expect(() => logger.error('Src', 'fail')).not.toThrow();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
