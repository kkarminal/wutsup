import {
  createDiscoveryApiClient,
  DiscoveryApiError,
} from './discoveryApi';

import type { DiscoveryApiClient, DiscoveryPageResponse } from './discoveryApi';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePageResponse(overrides: Partial<DiscoveryPageResponse> = {}): DiscoveryPageResponse {
  return {
    items: [
      {
        id: 1,
        name: 'Test Item',
        description: 'A test discovery item',
        latitude: 30.2672,
        longitude: -97.7431,
        city: 'Austin',
        address: '123 Main St',
        imageUrl: 'https://picsum.photos/seed/1/400/300',
        navigationNodeId: 6,
        categoryLabel: 'Music',
        metadata: { eventDate: '2025-06-01' },
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 20,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── createDiscoveryApiClient ─────────────────────────────────────────────────

describe('createDiscoveryApiClient', () => {
  let fetchSpy: jest.SpyInstance;
  let client: DiscoveryApiClient;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(makePageResponse()),
    );
    client = createDiscoveryApiClient('http://localhost:5000');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns an object with a getItems method', () => {
    expect(typeof client.getItems).toBe('function');
  });

  describe('getItems', () => {
    it('calls fetch with the correct URL and default parameters', async () => {
      await client.getItems(6);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://localhost:5000/api/discovery/items?nodeId=6&page=1&pageSize=20');
    });

    it('uses provided page and pageSize parameters', async () => {
      await client.getItems(10, 3, 50);

      const [url] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://localhost:5000/api/discovery/items?nodeId=10&page=3&pageSize=50');
    });

    it('returns a typed DiscoveryPageResponse on success', async () => {
      const expected = makePageResponse();
      fetchSpy.mockResolvedValue(jsonResponse(expected));

      const result = await client.getItems(6);

      expect(result).toEqual(expected);
    });

    it('throws DiscoveryApiError with status code and message from response body', async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(jsonResponse({ message: 'Navigation node not found.' }, 404)),
      );

      const error = await client.getItems(999).catch((e) => e);
      expect(error).toBeInstanceOf(DiscoveryApiError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Navigation node not found.');
    });

    it('throws DiscoveryApiError with default message when body has no message field', async () => {
      fetchSpy.mockResolvedValue(
        new Response('Internal Server Error', { status: 500 }),
      );

      await expect(client.getItems(6)).rejects.toThrow(DiscoveryApiError);
      await expect(client.getItems(6)).rejects.toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('failed with status 500'),
      });
    });

    it('throws DiscoveryApiError on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('Failed to fetch'));

      await expect(client.getItems(6)).rejects.toThrow(DiscoveryApiError);
      await expect(client.getItems(6)).rejects.toMatchObject({
        statusCode: 0,
        message: 'Failed to fetch',
      });
    });

    it('passes the AbortSignal to fetch', async () => {
      const controller = new AbortController();
      await client.getItems(6, 1, 20, controller.signal);

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.signal).toBe(controller.signal);
    });

    it('re-throws AbortError without wrapping in DiscoveryApiError', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      fetchSpy.mockRejectedValue(abortError);

      await expect(client.getItems(6)).rejects.toThrow('The operation was aborted');
      await expect(client.getItems(6)).rejects.toHaveProperty('name', 'AbortError');
    });

    it('uses the provided base URL without modification', async () => {
      const customClient = createDiscoveryApiClient('https://api.example.com');
      await customClient.getItems(1);

      const [url] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/discovery/items?nodeId=1&page=1&pageSize=20');
    });
  });
});

describe('DiscoveryApiError', () => {
  it('extends Error', () => {
    const error = new DiscoveryApiError('test', 404);
    expect(error).toBeInstanceOf(Error);
  });

  it('has the correct name', () => {
    const error = new DiscoveryApiError('test', 404);
    expect(error.name).toBe('DiscoveryApiError');
  });

  it('stores the status code', () => {
    const error = new DiscoveryApiError('not found', 404);
    expect(error.statusCode).toBe(404);
  });

  it('stores the message', () => {
    const error = new DiscoveryApiError('something went wrong', 500);
    expect(error.message).toBe('something went wrong');
  });
});
