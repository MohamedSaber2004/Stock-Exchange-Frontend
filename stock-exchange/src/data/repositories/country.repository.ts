import type { ApiResponse } from '@/domain/models/common.model'
import type {
  CountryDto,
  CreateCountryPayload,
  UpdateCountryPayload,
  GetCountriesPaginatedParams
} from '@/domain/models/country.model'
import type { PagginatedResult } from '@/domain/models/user.model'
import type { ICountryRepository } from '@/domain/ports/country-repository.port'
import type { HttpClient } from '@/infrastructure/http/http-client'
import { ApiEndpoints } from '@/data/endpoints'

export class CountryRepository implements ICountryRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  private mapCountryDto(raw: Record<string, unknown>): CountryDto {
    return {
      id: String(raw.id ?? raw.Id ?? ''),
      countryArName: String(raw.countryArName ?? raw.CountryArName ?? ''),
      countryEnName: String(raw.countryEnName ?? raw.CountryEnName ?? ''),
      code: String(raw.code ?? raw.Code ?? ''),
      isActive: Boolean(raw.isActive ?? raw.IsActive ?? true),
      usersCount: Number(raw.usersCount ?? raw.UsersCount ?? 0),
      createdAt: raw.createdAt != null ? String(raw.createdAt ?? raw.CreatedAt) : undefined
    }
  }

  async getAll(): Promise<CountryDto[]> {
    const response = await this.httpClient.get<ApiResponse<unknown>>(ApiEndpoints.Countries.Base, {
      requiresAuth: false
    })

    const raw = response.data as Record<string, unknown>
    const list = Array.isArray(response.data)
      ? response.data
      : raw && Array.isArray(raw.data)
        ? raw.data
        : []

    return (list as Record<string, unknown>[]).map(item => this.mapCountryDto(item))
  }

  async getAllPaginated(params?: GetCountriesPaginatedParams): Promise<PagginatedResult<CountryDto>> {
    const queryParams: Record<string, string | number | boolean | undefined | null> = {}

    const searchTerm = params?.search || params?.searchTerm
    if (searchTerm) queryParams.Search = searchTerm
    if (params?.isActive !== undefined && params?.isActive !== null) {
      queryParams.IsActive = params.isActive
    }
    if (params?.pageNumber) queryParams.PageNumber = params.pageNumber
    if (params?.pageSize) queryParams.PageSize = params.pageSize

    const response = await this.httpClient.get<ApiResponse<PagginatedResult<Record<string, unknown>>>>(
      ApiEndpoints.Countries.Paginated,
      {
        params: queryParams,
        requiresAuth: true
      }
    )

    const rawData = response.data || {
      items: [],
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      totalCount: 0,
      hasPreviousPage: false,
      hasNextPage: false
    }

    const items = Array.isArray(rawData.items)
      ? rawData.items.map(item => this.mapCountryDto(item as Record<string, unknown>))
      : []

    return {
      items,
      pageNumber: Number(rawData.pageNumber || 1),
      pageSize: Number(rawData.pageSize || 10),
      totalPages: Number(rawData.totalPages || 1),
      totalCount: Number(rawData.totalCount || items.length),
      hasPreviousPage: Boolean(rawData.hasPreviousPage),
      hasNextPage: Boolean(rawData.hasNextPage)
    }
  }

  async getById(id: string): Promise<CountryDto> {
    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>(ApiEndpoints.Countries.ById(id), {
      requiresAuth: true
    })
    return this.mapCountryDto(response.data || {})
  }

  async create(payload: CreateCountryPayload): Promise<CountryDto> {
    const response = await this.httpClient.post<ApiResponse<Record<string, unknown>>>(ApiEndpoints.Countries.Base, payload, {
      requiresAuth: true
    })
    return this.mapCountryDto(response.data || {})
  }

  async update(id: string, payload: UpdateCountryPayload): Promise<CountryDto> {
    const response = await this.httpClient.put<ApiResponse<Record<string, unknown>>>(ApiEndpoints.Countries.ById(id), payload, {
      requiresAuth: true
    })
    return this.mapCountryDto(response.data || {})
  }

  async delete(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(ApiEndpoints.Countries.ById(id), {
      requiresAuth: true
    })
    return Boolean(response.data ?? true)
  }
}
