import type { ApiResponse } from '@/domain/models/common.model'
import type { PagginatedResult } from '@/domain/models/user.model'
import type { VideoCategory } from '@/domain/models/video-category.model'
import type { VideoDto, GetVideosParams } from '@/domain/models/video.model'
import type { HttpClient } from '@/infrastructure/http/http-client'

export class VideoRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async getCategories(applyLanguageFilter: boolean = false): Promise<VideoCategory[]> {
    const response = await this.httpClient.get<ApiResponse<VideoCategory[]>>('/video-categories', {
      params: { applyLanguageFilter },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: VideoCategory[] }).data)) {
      return (raw as { data: VideoCategory[] }).data
    }
    return []
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
