import type { ApiResponse } from '@/domain/models/common.model'
import type { PagginatedResult } from '@/domain/models/user.model'
import type {
  NewsDto,
  GetNewsParams,
  CreateNewsPayload,
  UpdateNewsPayload
} from '@/domain/models/news.model'
import type { HttpClient } from '@/infrastructure/http/http-client'
import { ApiEndpoints } from '@/data/endpoints'

export class NewsRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async getAll(params?: GetNewsParams): Promise<PagginatedResult<NewsDto>> {
    const response = await this.httpClient.get<ApiResponse<PagginatedResult<NewsDto>>>(ApiEndpoints.News.Base, {
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
      return (raw as { data: PagginatedResult<NewsDto> }).data
    }
    return raw as PagginatedResult<NewsDto>
  }

  async getById(id: string): Promise<NewsDto> {
    const response = await this.httpClient.get<ApiResponse<NewsDto>>(ApiEndpoints.News.ById(id), {
      params: { applyLanguageFilter: false },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: NewsDto }).data
    }
    return raw as NewsDto
  }

  async create(payload: CreateNewsPayload): Promise<NewsDto> {
    const cleanPayload = {
      ...payload,
      imageUrl: payload.imageUrl ? payload.imageUrl : null
    }
    const response = await this.httpClient.post<ApiResponse<NewsDto>>(ApiEndpoints.News.Base, cleanPayload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: NewsDto }).data
    }
    return raw as NewsDto
  }

  async update(id: string, payload: UpdateNewsPayload): Promise<NewsDto> {
    const cleanPayload = {
      ...payload,
      imageUrl: payload.imageUrl ? payload.imageUrl : null
    }
    const response = await this.httpClient.put<ApiResponse<NewsDto>>(ApiEndpoints.News.ById(id), cleanPayload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: NewsDto }).data
    }
    return raw as NewsDto
  }

  async delete(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(ApiEndpoints.News.ById(id), {
      requiresAuth: true
    })
    return Boolean((response.data as unknown as { data?: boolean })?.data ?? true)
  }
}
