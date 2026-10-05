import type { ApiResponse } from '@/domain/models/common.model'
import type { PagginatedResult } from '@/domain/models/user.model'
import type {
  ServiceDto,
  GetServicesParams,
  CreateServicePayload,
  UpdateServicePayload
} from '@/domain/models/service.model'
import type { HttpClient } from '@/infrastructure/http/http-client'
import { ApiEndpoints } from '@/data/endpoints'

export class ServiceRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async getAll(params?: GetServicesParams): Promise<PagginatedResult<ServiceDto>> {
    const response = await this.httpClient.get<ApiResponse<PagginatedResult<ServiceDto>>>(ApiEndpoints.Services.Base, {
      params: {
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 10,
        search: params?.search?.trim() || undefined,
        isActive: params?.isActive,
        applyLanguageFilter: params?.applyLanguageFilter ?? false
      },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: PagginatedResult<ServiceDto> }).data
    }
    return raw as PagginatedResult<ServiceDto>
  }

  async getById(id: string): Promise<ServiceDto> {
    const response = await this.httpClient.get<ApiResponse<ServiceDto>>(ApiEndpoints.Services.ById(id), {
      params: { applyLanguageFilter: false },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: ServiceDto }).data
    }
    return raw as ServiceDto
  }

  async create(payload: CreateServicePayload): Promise<ServiceDto> {
    const response = await this.httpClient.post<ApiResponse<ServiceDto>>(ApiEndpoints.Services.Base, payload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: ServiceDto }).data
    }
    return raw as ServiceDto
  }

  async update(id: string, payload: UpdateServicePayload): Promise<ServiceDto> {
    const response = await this.httpClient.put<ApiResponse<ServiceDto>>(ApiEndpoints.Services.ById(id), payload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: ServiceDto }).data
    }
    return raw as ServiceDto
  }

  async delete(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(ApiEndpoints.Services.ById(id), {
      requiresAuth: true
    })
    return Boolean((response.data as unknown as { data?: boolean })?.data ?? true)
  }
}
