import type { ApiResponse } from '@/domain/models/common.model'
import type {
  UserDto,
  UserDetailsDto,
  GetAllUsersQuery,
  AddUserCommand,
  UpdateUserCommand,
  AdminChangePasswordRequest,
  PagginatedResult,
} from '@/domain/models/user.model'
import { UserType } from '@/domain/models/user.model'
import type { IUserRepository } from '@/domain/ports/user-repository.port'
import type { HttpClient } from '@/infrastructure/http/http-client'

export class UserRepository implements IUserRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  private mapUserDto(raw: Record<string, unknown>): UserDto {
    const rawType = raw.userType ?? raw.UserType
    const userType: UserType =
      typeof rawType === 'number'
        ? rawType
        : String(rawType).toLowerCase() === 'admin'
          ? UserType.Admin
          : UserType.Customer

    return {
      id: String(raw.id ?? raw.Id ?? ''),
      fullName: String(raw.fullName ?? raw.FullName ?? ''),
      email: String(raw.email ?? raw.Email ?? ''),
      phoneNumber: raw.phoneNumber != null ? String(raw.phoneNumber ?? raw.PhoneNumber) : null,
      profilePictureUrl:
        raw.profilePictureUrl != null ? String(raw.profilePictureUrl ?? raw.ProfilePictureUrl) : null,
      userType,
      userTypeArabic: raw.userTypeArabic != null ? String(raw.userTypeArabic) : undefined,
      userTypeEnglish: raw.userTypeEnglish != null ? String(raw.userTypeEnglish) : undefined,
      userTypeTitle: raw.userTypeTitle != null ? String(raw.userTypeTitle) : undefined,
      role: String(raw.role ?? raw.Role ?? (userType === UserType.Admin ? 'Admin' : 'Customer')),
      isActive: Boolean(raw.isActive ?? raw.IsActive ?? false),
      statusArabic: raw.statusArabic != null ? String(raw.statusArabic) : undefined,
      statusEnglish: raw.statusEnglish != null ? String(raw.statusEnglish) : undefined,
      statusTitle: raw.statusTitle != null ? String(raw.statusTitle) : undefined,
      createdAt: String(raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString()),
      countryId: raw.countryId != null ? String(raw.countryId ?? raw.CountryId) : null,
      countryArName: raw.countryArName != null ? String(raw.countryArName ?? raw.CountryArName) : null,
      countryEnName: raw.countryEnName != null ? String(raw.countryEnName ?? raw.CountryEnName) : null,
      countryName: raw.countryName != null ? String(raw.countryName ?? raw.CountryName) : null,
      countryCode: raw.countryCode != null ? String(raw.countryCode ?? raw.CountryCode) : null,
    }
  }

  private mapUserDetailsDto(raw: Record<string, unknown>): UserDetailsDto {
    const base = this.mapUserDto(raw)
    return {
      ...base,
      emailConfirmed: Boolean(raw.emailConfirmed ?? raw.EmailConfirmed ?? false),
      updatedAt: raw.updatedAt != null ? String(raw.updatedAt ?? raw.UpdatedAt) : null,
      language: Number(raw.language ?? raw.Language ?? 0),
    }
  }

  async getAll(query?: GetAllUsersQuery): Promise<PagginatedResult<UserDto>> {
    const params: Record<string, string | number | boolean | undefined | null> = {}

    if (query?.search) params.Search = query.search
    if (query?.userType !== undefined && query?.userType !== null) {
      params.UserType = query.userType
    }
    if (query?.isActive !== undefined && query?.isActive !== null) {
      params.IsActive = query.isActive
    }
    if (query?.pageNumber) params.PageNumber = query.pageNumber
    if (query?.pageSize) params.PageSize = query.pageSize

    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>('/users', {
      params,
      requiresAuth: true,
    })

    const data = (response.data || {}) as Record<string, unknown>
    const rawItems = (data.items || data.Items || []) as Record<string, unknown>[]

    return {
      items: rawItems.map((item) => this.mapUserDto(item)),
      pageNumber: Number(data.pageNumber ?? data.PageNumber ?? query?.pageNumber ?? 1),
      pageSize: Number(data.pageSize ?? data.PageSize ?? query?.pageSize ?? 10),
      totalPages: Number(data.totalPages ?? data.TotalPages ?? 1),
      totalCount: Number(data.totalCount ?? data.TotalCount ?? rawItems.length),
      hasPreviousPage: Boolean(data.hasPreviousPage ?? data.HasPreviousPage ?? false),
      hasNextPage: Boolean(data.hasNextPage ?? data.HasNextPage ?? false),
    }
  }

  async getById(id: string): Promise<UserDetailsDto> {
    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>(`/users/${id}`, {
      requiresAuth: true,
    })

    if (!response.data) {
      throw new Error(response.message || 'User not found')
    }

    return this.mapUserDetailsDto(response.data)
  }

  async create(command: AddUserCommand): Promise<UserDto> {
    const response = await this.httpClient.post<ApiResponse<Record<string, unknown>>>('/users', command, {
      requiresAuth: true,
    })

    if (!response.data) {
      throw new Error(response.message || 'Failed to create user')
    }

    return this.mapUserDto(response.data)
  }

  async update(id: string, command: UpdateUserCommand): Promise<UserDto> {
    const response = await this.httpClient.put<ApiResponse<Record<string, unknown>>>(
      `/users/${id}`,
      { ...command, id },
      { requiresAuth: true }
    )

    if (!response.data) {
      throw new Error(response.message || 'Failed to update user')
    }

    return this.mapUserDto(response.data)
  }

  async delete(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(`/users/${id}`, {
      requiresAuth: true,
    })
    return Boolean(response.success)
  }

  async changePassword(id: string, request: AdminChangePasswordRequest): Promise<boolean> {
    const response = await this.httpClient.put<ApiResponse<boolean>>(
      `/users/${id}/change-password`,
      request,
      { requiresAuth: true }
    )
    return Boolean(response.success)
  }
}
