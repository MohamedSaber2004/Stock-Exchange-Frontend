import type {
  AuthResponseDto,
  RefreshTokenResponseDto,
  LoginCredentials,
  ForgetPasswordPayload,
  VerifyOtpPayload,
  ResetPasswordPayload,
  UserProfileDto,
  UpdateUserInfoPayload,
  User,
} from '../models/user.model'

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthResponseDto>
  forgetPassword(payload: ForgetPasswordPayload): Promise<boolean>
  verifyOtp(payload: VerifyOtpPayload): Promise<string>
  resetPassword(payload: ResetPasswordPayload): Promise<boolean>
  refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto>
  logout(): Promise<void>
  getCurrentUser(): User | null
  getUserProfile(): Promise<UserProfileDto>
  updateProfile(payload: UpdateUserInfoPayload): Promise<string>
  changePassword(payload: {
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
  }): Promise<boolean>
}



