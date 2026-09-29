export type UserRole = 'ADMIN' | 'PROVIDER' | 'USER'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  organization?: string
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginCredentials {
  email: string
  password?: string
  otp?: string
}

export interface AuthSession {
  user: User
  tokens: AuthTokens
}
