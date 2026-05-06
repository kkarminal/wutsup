export interface Review {
  authorName: string;
  rating: number;
  text: string;
  relativeTimeDescription: string;
}

export interface RatingData {
  rating: number;
  reviewCount: number;
  reviews: Review[];
}

export interface DayHours {
  day: string;
  hours: string;
}

export interface HoursData {
  weekdayHours: DayHours[];
}

export interface HourPopularity {
  hour: number;
  popularityPercent: number;
}

export interface BusyTimesData {
  hourlyPopularity: HourPopularity[];
}

export interface DiscoveryItem {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  city: string;
  address: string | null;
  imageUrl: string | null;
  navigationNodeId: number;
  categoryLabel: string;
  metadata: Record<string, unknown> | null;
  rating: RatingData | null;
  hours: HoursData | null;
  busyTimes: BusyTimesData | null;
}

export interface DiscoveryPageResponse {
  items: DiscoveryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export class DiscoveryApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'DiscoveryApiError';
    this.statusCode = statusCode;
  }
}

export interface DiscoveryApiClient {
  getItems(
    nodeId: number,
    page?: number,
    pageSize?: number,
    signal?: AbortSignal,
  ): Promise<DiscoveryPageResponse>;
}

/**
 * Creates a typed HTTP client for the discovery items API.
 *
 * - `getItems(nodeId, page?, pageSize?, signal?)`: GET `{apiBaseUrl}/api/discovery/items`
 *   with query parameters `nodeId`, `page` (default 1), and `pageSize` (default 20).
 *
 * Throws `DiscoveryApiError` on non-200 responses or network failures.
 * Supports request cancellation via an optional `AbortSignal`.
 */
export function createDiscoveryApiClient(apiBaseUrl: string): DiscoveryApiClient {
  return {
    async getItems(
      nodeId: number,
      page: number = 1,
      pageSize: number = 20,
      signal?: AbortSignal,
    ): Promise<DiscoveryPageResponse> {
      const url = `${apiBaseUrl}/api/discovery/items?nodeId=${nodeId}&page=${page}&pageSize=${pageSize}`;

      let response: Response;
      try {
        response = await fetch(url, { signal });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err;
        }
        const message = err instanceof Error ? err.message : 'Network error';
        throw new DiscoveryApiError(message, 0);
      }

      if (!response.ok) {
        let errorMessage = `GET /api/discovery/items failed with status ${response.status}`;
        try {
          const body = await response.json();
          if (body && typeof body.message === 'string') {
            errorMessage = body.message;
          }
        } catch {
          // Use default error message if body parsing fails
        }
        throw new DiscoveryApiError(errorMessage, response.status);
      }

      return response.json() as Promise<DiscoveryPageResponse>;
    },
  };
}
