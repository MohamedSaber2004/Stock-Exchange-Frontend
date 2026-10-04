import type { ApiResponse } from '@/domain/models/common.model'
import type { PagginatedResult } from '@/domain/models/user.model'
import type {
  VideoCategory,
  CreateVideoCategoryPayload,
  UpdateVideoCategoryPayload
} from '@/domain/models/video-category.model'
import type { VideoDto, GetVideosParams } from '@/domain/models/video.model'
import type { HttpClient } from '@/infrastructure/http/http-client'

export class VideoRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async getCategories(paramsOrFilter?: boolean | { search?: string; applyLanguageFilter?: boolean }): Promise<VideoCategory[]> {
    let search: string | undefined
    let applyLanguageFilter = false

    if (typeof paramsOrFilter === 'boolean') {
      applyLanguageFilter = paramsOrFilter
    } else if (paramsOrFilter && typeof paramsOrFilter === 'object') {
      search = paramsOrFilter.search
      applyLanguageFilter = paramsOrFilter.applyLanguageFilter ?? false
    }

    const response = await this.httpClient.get<ApiResponse<VideoCategory[]>>('/video-categories', {
      params: { search, applyLanguageFilter },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: VideoCategory[] }).data)) {
      return (raw as { data: VideoCategory[] }).data
    }
    return []
  }

  async createCategory(payload: CreateVideoCategoryPayload): Promise<VideoCategory> {
    const response = await this.httpClient.post<ApiResponse<VideoCategory>>('/video-categories', payload, {
      requiresAuth: true
    })
    return (response.data as unknown as { data?: VideoCategory })?.data || (response.data as unknown as VideoCategory)
  }

  async updateCategory(id: string, payload: UpdateVideoCategoryPayload): Promise<VideoCategory> {
    const response = await this.httpClient.put<ApiResponse<VideoCategory>>(`/video-categories/${id}`, payload, {
      requiresAuth: true
    })
    return (response.data as unknown as { data?: VideoCategory })?.data || (response.data as unknown as VideoCategory)
  }

  async deleteCategory(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(`/video-categories/${id}`, {
      requiresAuth: true
    })
    return Boolean(response.data ?? true)
  }

  async getAll(params?: GetVideosParams): Promise<PagginatedResult<VideoDto>> {
    const response = await this.httpClient.get<ApiResponse<PagginatedResult<VideoDto>>>('/videos', {
      params: {
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 10,
        search: params?.search,
        category: params?.category,
        videoCategoryId: params?.videoCategoryId ?? params?.categoryId,
        isActive: params?.isActive,
        applyLanguageFilter: params?.applyLanguageFilter ?? false
      },
      requiresAuth: true
    })
    return response.data as unknown as PagginatedResult<VideoDto>
  }
}

