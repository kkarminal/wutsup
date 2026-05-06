export interface NavigationNodeDto {
  id: number;
  label: string;
  icon: string | null;
  backgroundImageUrl: string | null;
  parentId: number | null;
  sortOrder: number;
  children: NavigationNodeDto[];
}

export interface CreateNodeRequest {
  label: string;
  icon?: string;
  parentId?: number | null;
  sortOrder?: number;
}

export interface UpdateNodeRequest {
  label?: string;
  icon?: string | null;
  sortOrder?: number;
}

export interface NavigationApiClient {
  getTree(): Promise<NavigationNodeDto>;
  createNode(req: CreateNodeRequest): Promise<NavigationNodeDto>;
  updateNode(id: number, req: UpdateNodeRequest): Promise<NavigationNodeDto>;
  deleteNode(id: number): Promise<void>;
}

export class NavigationApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'NavigationApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Creates a typed HTTP client for the navigation tree API.
 *
 * - `getTree()`: GET `{apiBaseUrl}/api/navigation/tree` — returns the full nested tree.
 * - `createNode(req)`: POST `{apiBaseUrl}/api/navigation/nodes` — creates a node, expects 201.
 * - `updateNode(id, req)`: PUT `{apiBaseUrl}/api/navigation/nodes/{id}` — updates a node, expects 200.
 * - `deleteNode(id)`: DELETE `{apiBaseUrl}/api/navigation/nodes/{id}` — removes a node, expects 204.
 *
 * All methods throw `NavigationApiError` on unexpected status codes or network failures.
 * Raw `Error` is never thrown — every error is wrapped in `NavigationApiError`.
 */
export function createNavigationApiClient(apiBaseUrl: string): NavigationApiClient {
  return {
    async getTree(): Promise<NavigationNodeDto> {
      let response: Response;
      try {
        response = await fetch(`${apiBaseUrl}/api/navigation/tree`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        throw new NavigationApiError(message, 0);
      }
      if (response.status !== 200) {
        throw new NavigationApiError(
          `GET /api/navigation/tree failed with status ${response.status}`,
          response.status,
        );
      }
      return response.json() as Promise<NavigationNodeDto>;
    },

    async createNode(req: CreateNodeRequest): Promise<NavigationNodeDto> {
      let response: Response;
      try {
        response = await fetch(`${apiBaseUrl}/api/navigation/nodes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        throw new NavigationApiError(message, 0);
      }
      if (response.status !== 201) {
        throw new NavigationApiError(
          `POST /api/navigation/nodes failed with status ${response.status}`,
          response.status,
        );
      }
      return response.json() as Promise<NavigationNodeDto>;
    },

    async updateNode(id: number, req: UpdateNodeRequest): Promise<NavigationNodeDto> {
      let response: Response;
      try {
        response = await fetch(`${apiBaseUrl}/api/navigation/nodes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        throw new NavigationApiError(message, 0);
      }
      if (response.status !== 200) {
        throw new NavigationApiError(
          `PUT /api/navigation/nodes/${id} failed with status ${response.status}`,
          response.status,
        );
      }
      return response.json() as Promise<NavigationNodeDto>;
    },

    async deleteNode(id: number): Promise<void> {
      let response: Response;
      try {
        response = await fetch(`${apiBaseUrl}/api/navigation/nodes/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        throw new NavigationApiError(message, 0);
      }
      if (response.status !== 204) {
        throw new NavigationApiError(
          `DELETE /api/navigation/nodes/${id} failed with status ${response.status}`,
          response.status,
        );
      }
    },
  };
}
