import type { AuthTokens, User } from '@/domain/models/user.model'

const ACCESS_TOKEN_KEY = 'app_access_token'
const REFRESH_TOKEN_KEY = 'app_refresh_token'
const USER_KEY = 'app_user_data'

export class TokenStore {
  private memoryAccessToken: string | null = null
  private memoryRefreshToken: string | null = null

  constructor() {
    this.memoryAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    this.memoryRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  getAccessToken(): string | null {
    return this.memoryAccessToken || localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  getRefreshToken(): string | null {
    return this.memoryRefreshToken || localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  setTokens(tokens: AuthTokens): void {
    this.memoryAccessToken = tokens.accessToken
    this.memoryRefreshToken = tokens.refreshToken
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  }

  getUser<T = User>(): T | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }

  clear(): void {
    this.memoryAccessToken = null
    this.memoryRefreshToken = null
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  hasValidToken(): boolean {
    return Boolean(this.getAccessToken())
  }
}
