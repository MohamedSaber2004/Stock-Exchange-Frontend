import type { ApiResponse } from '@/domain/models/common.model'
import type { PagginatedResult } from '@/domain/models/user.model'
import type {
  ExpertDto,
  GetExpertsParams,
  CreateExpertPayload,
  UpdateExpertPayload
} from '@/domain/models/expert.model'
import type { HttpClient } from '@/infrastructure/http/http-client'
import { ApiEndpoints } from '@/data/endpoints'

export class ExpertRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async getAll(params?: GetExpertsParams): Promise<PagginatedResult<ExpertDto>> {
    const response = await this.httpClient.get<ApiResponse<PagginatedResult<ExpertDto>>>(ApiEndpoints.Experts.Base, {
      params: {
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 10,
        search: params?.search?.trim() || undefined,
        isFeaturedOnHome: params?.isFeaturedOnHome,
        isActive: params?.isActive,
        applyLanguageFilter: params?.applyLanguageFilter ?? false
      },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: PagginatedResult<ExpertDto> }).data
    }
    return raw as PagginatedResult<ExpertDto>
  }

  async getById(id: string): Promise<ExpertDto> {
    const response = await this.httpClient.get<ApiResponse<ExpertDto>>(ApiEndpoints.Experts.ById(id), {
      params: { applyLanguageFilter: false },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: ExpertDto }).data
    }
    return raw as ExpertDto
  }

  async create(payload: CreateExpertPayload): Promise<ExpertDto> {
    const response = await this.httpClient.post<ApiResponse<ExpertDto>>(ApiEndpoints.Experts.Base, payload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: ExpertDto }).data
    }
    return raw as ExpertDto
  }

  async update(id: string, payload: UpdateExpertPayload): Promise<ExpertDto> {
    const response = await this.httpClient.put<ApiResponse<ExpertDto>>(ApiEndpoints.Experts.ById(id), payload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: ExpertDto }).data
    }
    return raw as ExpertDto
  }

  async delete(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(ApiEndpoints.Experts.ById(id), {
      requiresAuth: true
    })
    return Boolean((response.data as unknown as { data?: boolean })?.data ?? true)
  }
}
