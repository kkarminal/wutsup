import { loadConfig } from './config'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface NavigationNodeDto {
  id: number
  label: string
  icon: string | null
  backgroundImageUrl: string | null
  parentId: number | null
  sortOrder: number
  children: NavigationNodeDto[]
}

export interface UpdateNodeRequest {
  label?: string | null
  icon?: string | null
  sortOrder?: number | null
  backgroundImageUrl?: string | null
  updateBackgroundImageUrl?: boolean
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { apiBaseUrl } = loadConfig()

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password } satisfies LoginRequest),
    })
  } catch (err) {
    throw new Error('Network error: unable to reach the server')
  }

  if (response.status === 200) {
    return (await response.json()) as LoginResponse
  }

  if (response.status === 401) {
    throw new ApiError('Invalid credentials', 401)
  }

  if (response.status === 400) {
    throw new ApiError('Bad request', 400)
  }

  throw new Error(`Unexpected response status: ${response.status}`)
}

export async function getNavigationTree(token: string): Promise<NavigationNodeDto[]> {
  const { apiBaseUrl } = loadConfig()

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/api/navigation/tree`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  } catch (err) {
    throw new Error('Network error: unable to reach the server')
  }

  if (response.status === 200) {
    const root = (await response.json()) as NavigationNodeDto
    return root.children ?? []
  }

  if (response.status === 401) {
    throw new ApiError('Unauthorized', 401)
  }

  throw new Error(`Unexpected response status: ${response.status}`)
}

export async function updateNavigationNode(
  token: string,
  id: number,
  request: UpdateNodeRequest
): Promise<NavigationNodeDto> {
  const { apiBaseUrl } = loadConfig()

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/api/navigation/nodes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    })
  } catch (err) {
    throw new Error('Network error: unable to reach the server')
  }

  if (response.status === 200) {
    return (await response.json()) as NavigationNodeDto
  }

  if (response.status === 401) {
    throw new ApiError('Unauthorized', 401)
  }

  if (response.status === 400) {
    throw new ApiError('Bad request', 400)
  }

  if (response.status === 404) {
    throw new ApiError('Not found', 404)
  }

  throw new Error(`Unexpected response status: ${response.status}`)
}
