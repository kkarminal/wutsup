import { createApiClient } from './api';

import type { ApiClient } from './api';
import type { LogEntry } from './logger';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    timestamp: '2025-01-15T12:00:00.000Z',
    level: 'info',
    source: 'TestSource',
    message: 'test message',
    ...overrides,
  };
}

// ── createApiClient ──────────────────────────────────────────────────────────

describe('createApiClient', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns an object with a sendLogEntry method', () => {
    const client = createApiClient('http://localhost:5000');
    expect(typeof client.sendLogEntry).toBe('function');
  });

  it('POSTs to {apiBaseUrl}/api/logs', async () => {
    const client = createApiClient('http://localhost:5000');
    await client.sendLogEntry(makeLogEntry());

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('http://localhost:5000/api/logs');
  });

  it('sends the log entry as JSON in the request body', async () => {
    const entry = makeLogEntry({ level: 'error', source: 'App', message: 'crash' });
    const client = createApiClient('http://localhost:5000');
    await client.sendLogEntry(entry);

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });

    const body: LogEntry = JSON.parse(options.body);
    expect(body).toEqual(entry);
  });

  it('returns true when the server responds with 200', async () => {
    const client = createApiClient('http://localhost:5000');
    const result = await client.sendLogEntry(makeLogEntry());
    expect(result).toBe(true);
  });

  it('returns false when the server responds with a non-ok status', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 500 }));

    const client = createApiClient('http://localhost:5000');
    const result = await client.sendLogEntry(makeLogEntry());
    expect(result).toBe(false);
  });

  it('returns false when fetch rejects (network error)', async () => {
    fetchSpy.mockRejectedValue(new Error('network error'));

    const client = createApiClient('http://localhost:5000');
    const result = await client.sendLogEntry(makeLogEntry());
    expect(result).toBe(false);
  });

  it('does not throw when fetch rejects', async () => {
    fetchSpy.mockRejectedValue(new Error('network error'));

    const client = createApiClient('http://localhost:5000');
    await expect(client.sendLogEntry(makeLogEntry())).resolves.not.toThrow();
  });

  it('uses the provided base URL without modification', async () => {
    const client = createApiClient('https://api.example.com');
    await client.sendLogEntry(makeLogEntry());

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.example.com/api/logs');
  });
});
