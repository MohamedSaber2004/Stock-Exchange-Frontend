export enum UserType {
  Customer = 0,
  Admin = 1,
}

export type UserRole = 'ADMIN' | 'PROVIDER' | 'USER'

export interface User {
  id: string
  name: string
  fullName?: string
  email: string
  phoneNumber?: string
  countryId?: string
  role?: UserRole
  roles?: string
  avatarUrl?: string
  profilePictureUrl?: string
  organization?: string
  createdAt?: string
}

export interface UserDto {
  id: string
  fullName: string
  email: string
  phoneNumber?: string | null
  profilePictureUrl?: string | null
  userType: UserType
  userTypeArabic?: string
  userTypeEnglish?: string
  userTypeTitle?: string
  role: string
  isActive: boolean
  statusArabic?: string
  statusEnglish?: string
  statusTitle?: string
  createdAt: string
  countryId?: string | null
  countryArName?: string | null
  countryEnName?: string | null
  countryName?: string | null
  countryCode?: string | null
}

export interface UserDetailsDto extends UserDto {
  emailConfirmed: boolean
  updatedAt?: string | null
  language: number
}

export interface GetAllUsersQuery {
  search?: string
  userType?: UserType
  isActive?: boolean
  pageNumber?: number
  pageSize?: number
}

export interface AddUserCommand {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber?: string | null
  countryId?: string | null
  userType: UserType
  isActive: boolean
}

export interface UpdateUserCommand {
  id: string
  fullName: string
  email: string
  phoneNumber?: string | null
  countryId?: string | null
  userType: UserType
  isActive: boolean
}

export interface AdminChangePasswordRequest {
  newPassword: string
  confirmNewPassword: string
}

export interface PagginatedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn?: number
}

export interface AuthResponseDto {
  accessToken: string
  refreshToken: string
  fullName: string
  email: string
  phoneNumber: string
  roles: string
  id: string
  profilePictureUrl?: string
}

export interface RefreshTokenResponseDto {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface ForgetPasswordPayload {
  email: string
}

export interface VerifyOtpPayload {
  email: string
  otpCode: string
}

export interface ResetPasswordPayload {
  email: string
  otpCode: string // Reset token or 6-digit OTP
  newPassword: string
  confirmPassword: string
}

export enum UserLanguage {
  Arabic = 0,
  English = 1,
}

export interface UserProfileDto {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  phoneCode?: string | null
  profilePictureUrl?: string | null
  countryId?: string | null
  language: UserLanguage | number
}

export interface UpdateUserInfoPayload {
  fullName?: string
  email?: string
  phoneNumber?: string
  countryId?: string
  language?: UserLanguage | number
  profilePictureUrl?: string | null
  pictureProfileUrl?: string | null
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export interface AuthSession {


  user: User
  tokens: AuthTokens
}

/**
 * دالة مساعدة للتحقق من صلاحية الأدمن
 * حقل roles في الـ Backend يعود كنص مفصول بفواصل مثل: "Admin" أو "Customer,Admin"
 */
export function hasAdminRole(roles: string | string[] | undefined | null): boolean {
  if (!roles) return false
  if (Array.isArray(roles)) {
    return roles.some((r) => r.trim().toLowerCase() === 'admin')
  }
  const roleList = String(roles).split(',').map((r) => r.trim().toLowerCase())
  return roleList.includes('admin')
}

