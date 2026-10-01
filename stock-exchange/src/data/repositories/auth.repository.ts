import type { ApiResponse, AppError } from '@/domain/models/common.model'
import {
  hasAdminRole,
  type AuthResponseDto,
  type ForgetPasswordPayload,
  type LoginCredentials,
  type RefreshTokenResponseDto,
  type ResetPasswordPayload,
  type User,
  type VerifyOtpPayload,
  type UserProfileDto,
  type UpdateUserInfoPayload,
  type ChangePasswordPayload,
} from '@/domain/models/user.model'
import type { IAuthRepository } from '@/domain/ports/auth-repository.port'
import type { HttpClient } from '@/infrastructure/http/http-client'
import type { TokenStore } from '@/infrastructure/storage/token-store'

export class AuthRepository implements IAuthRepository {
  private httpClient: HttpClient
  private tokenStore: TokenStore

  constructor(httpClient: HttpClient, tokenStore: TokenStore) {
    this.httpClient = httpClient
    this.tokenStore = tokenStore
  }

  async login(credentials: LoginCredentials): Promise<AuthResponseDto> {
    const response = await this.httpClient.post<ApiResponse<AuthResponseDto>>(
      '/authentication/login',
      credentials,
      { requiresAuth: false }
    )

    if (!response.success || !response.data) {
      const error: AppError = {
        code: 'AUTH_FAILED',
        message: response.message || 'فشل تسجيل الدخول',
        statusCode: response.statusCode || 400,
        status: response.statusCode || 400,
        errors: response.errors,
      }
      throw error
    }

    const authData = response.data

    // التحقق الصارم من رتبة الأدمن (Role Guard)
    if (!hasAdminRole(authData.roles)) {
      this.tokenStore.clear()
      const forbiddenError: AppError = {
        code: 'FORBIDDEN_NOT_ADMIN',
        message: 'عفواً، لا تملك الصلاحيات الكافية للوصول إلى لوحة التحكم.',
        statusCode: 403,
        status: 403,
        fieldErrors: {
          general: 'عفواً، لا تملك الصلاحيات الكافية للوصول إلى لوحة التحكم.',
        },
      }
      throw forbiddenError
    }

    // حفظ التوكنات وبيانات المستخدم في الـ Storage
    this.tokenStore.setTokens({
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
    })

    const user: User = {
      id: authData.id,
      name: authData.fullName,
      fullName: authData.fullName,
      email: authData.email,
      phoneNumber: authData.phoneNumber,
      countryId: (authData as unknown as Record<string, unknown>).countryId
        ? String((authData as unknown as Record<string, unknown>).countryId)
        : undefined,
      roles: authData.roles,
      role: 'ADMIN',
      profilePictureUrl: authData.profilePictureUrl,
      avatarUrl: authData.profilePictureUrl,
    }

    this.tokenStore.setUser(user)

    return authData
  }

  async forgetPassword(payload: ForgetPasswordPayload): Promise<boolean> {
    const response = await this.httpClient.post<ApiResponse<boolean>>(
      '/authentication/forget-password',
      payload,
      { requiresAuth: false }
    )

    return Boolean(response.data ?? response.success)
  }

  async verifyOtp(payload: VerifyOtpPayload): Promise<string> {
    const response = await this.httpClient.post<ApiResponse<string>>(
      '/authentication/verify-otp',
      payload,
      { requiresAuth: false }
    )

    return response.data || ''
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<boolean> {
    const response = await this.httpClient.post<ApiResponse<boolean>>(
      '/authentication/reset-password',
      payload,
      { requiresAuth: false }
    )

    return Boolean(response.data ?? response.success)
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
    const response = await this.httpClient.post<ApiResponse<RefreshTokenResponseDto>>(
      '/authentication/refresh-token',
      { refreshToken },
      { requiresAuth: false }
    )

    if (!response.data) {
      throw new Error(response.message || 'Failed to refresh token')
    }

    // Update tokens with new rotated refresh token
    this.tokenStore.setTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken || refreshToken,
    })

    return response.data
  }

  async logout(): Promise<void> {
    const refreshToken = this.tokenStore.getRefreshToken()
    try {
      if (this.tokenStore.hasValidToken()) {
        await this.httpClient.post<ApiResponse<boolean>>(
          '/authentication/logout',
          { refreshToken: refreshToken || null },
          { requiresAuth: true }
        )
      }
    } catch {
      // Even if network logout fails, always clean up local state
    } finally {
      this.tokenStore.clear()
    }
  }

  getCurrentUser(): User | null {
    return this.tokenStore.getUser()
  }

  async getUserProfile(): Promise<UserProfileDto> {
    const response = await this.httpClient.get<ApiResponse<unknown>>(
      '/authentication/my-profile',
      { requiresAuth: true }
    )

    if (!response.data) {
      const err: AppError = {
        code: 'PROFILE_LOAD_FAILED',
        message: response.message || 'فشل جلب بيانات الملف الشخصي',
        statusCode: response.statusCode || 400,
      }
      throw err
    }

    // فك التغليف في حال إرجاع الباك إند كائن Result<T> بداخله كائن data آخر
    const rawData = response.data as Record<string, unknown>
    const innerData = (rawData && typeof rawData === 'object' && 'data' in rawData && rawData.data
      ? rawData.data
      : rawData) as Record<string, unknown>

    const profileData: UserProfileDto = {
      id: String(innerData.id ?? innerData.Id ?? ''),
      fullName: String(innerData.fullName ?? innerData.FullName ?? innerData.name ?? innerData.Name ?? ''),
      email: String(innerData.email ?? innerData.Email ?? ''),
      phoneNumber: String(innerData.phoneNumber ?? innerData.PhoneNumber ?? ''),
      countryId: (innerData.countryId ?? innerData.CountryId)
        ? String(innerData.countryId ?? innerData.CountryId)
        : undefined,
      phoneCode: (innerData.phoneCode ?? innerData.PhoneCode)
        ? String(innerData.phoneCode ?? innerData.PhoneCode)
        : undefined,
      profilePictureUrl: (innerData.profilePictureUrl ?? innerData.ProfilePictureUrl)
        ? String(innerData.profilePictureUrl ?? innerData.ProfilePictureUrl)
        : undefined,
      language: (innerData.language ?? innerData.Language ?? 0) as UserProfileDto['language'],
    }

    // مزامنة بيانات المستخدم الحالية في الـ TokenStore لضمان تحديث الـ Header والـ Sidebar فوراً
    const currentUser = this.tokenStore.getUser()
    if (currentUser) {
      this.tokenStore.setUser({
        ...currentUser,
        id: profileData.id || currentUser.id,
        name: profileData.fullName || currentUser.name,
        fullName: profileData.fullName || currentUser.fullName,
        email: profileData.email || currentUser.email,
        phoneNumber: profileData.phoneNumber || currentUser.phoneNumber,
        countryId: profileData.countryId || currentUser.countryId,
        profilePictureUrl: profileData.profilePictureUrl || currentUser.profilePictureUrl,
        avatarUrl: profileData.profilePictureUrl || currentUser.avatarUrl,
      })
    }

    return profileData
  }

  async updateProfile(payload: UpdateUserInfoPayload): Promise<string> {
    const response = await this.httpClient.patch<ApiResponse<string>>(
      '/authentication/update/myprofile',
      payload,
      { requiresAuth: true }
    )

    // تحديث بيانات المستخدم المخزنة محلياً عند نجاح التعديل
    const currentUser = this.tokenStore.getUser()
    if (currentUser) {
      const pic = payload.profilePictureUrl ?? payload.pictureProfileUrl ?? currentUser.profilePictureUrl
      this.tokenStore.setUser({
        ...currentUser,
        fullName: payload.fullName ?? currentUser.fullName,
        name: payload.fullName ?? currentUser.name,
        email: payload.email ?? currentUser.email,
        phoneNumber: payload.phoneNumber ?? currentUser.phoneNumber,
        countryId: payload.countryId ?? currentUser.countryId,
        profilePictureUrl: pic,
        avatarUrl: pic,
      })
    }

    return response.message || response.data || 'تم تحديث الملف الشخصي بنجاح'
  }

  async changePassword(payload: ChangePasswordPayload): Promise<boolean> {
    const response = await this.httpClient.post<ApiResponse<boolean>>(
      '/authentication/change-password',
      payload,
      { requiresAuth: true }
    )

    return Boolean(response.data ?? response.success)
  }
}


