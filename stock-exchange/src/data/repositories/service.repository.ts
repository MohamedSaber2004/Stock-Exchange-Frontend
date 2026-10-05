import type { ApiResponse } from '@/domain/models/common.model'
import type { PagginatedResult } from '@/domain/models/user.model'
import type {
  ServiceDto,
  GetServicesParams,
  CreateServicePayload,
  UpdateServicePayload
} from '@/domain/models/service.model'
import type { HttpClient } from '@/infrastructure/http/http-client'

export class ServiceRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async getAll(params?: GetServicesParams): Promise<PagginatedResult<ServiceDto>> {
    const response = await this.httpClient.get<ApiResponse<PagginatedResult<ServiceDto>>>('/services', {
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
    const response = await this.httpClient.get<ApiResponse<ServiceDto>>(`/services/${id}`, {
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
    const response = await this.httpClient.post<ApiResponse<ServiceDto>>('/services', payload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: ServiceDto }).data
    }
    return raw as ServiceDto
  }

  async update(id: string, payload: UpdateServicePayload): Promise<ServiceDto> {
    const response = await this.httpClient.put<ApiResponse<ServiceDto>>(`/services/${id}`, payload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: ServiceDto }).data
    }
    return raw as ServiceDto
  }

  async delete(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(`/services/${id}`, {
      requiresAuth: true
    })
    return Boolean((response.data as unknown as { data?: boolean })?.data ?? true)
  }
}
