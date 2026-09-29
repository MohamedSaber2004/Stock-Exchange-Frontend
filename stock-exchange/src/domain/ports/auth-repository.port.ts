import type { AuthSession, AuthTokens, LoginCredentials, User } from '../models/user.model'

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>
  logout(): Promise<void>
  refreshToken(refreshToken: string): Promise<AuthTokens>
  getCurrentUser(): Promise<User>
}
