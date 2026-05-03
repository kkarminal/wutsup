import { loadConfig } from './config'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
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
