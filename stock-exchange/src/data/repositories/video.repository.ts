import type { ApiResponse } from '@/domain/models/common.model'
import type { PagginatedResult } from '@/domain/models/user.model'
import type {
  VideoCategory,
  CreateVideoCategoryPayload,
  UpdateVideoCategoryPayload
} from '@/domain/models/video-category.model'
import type {
  VideoDto,
  GetVideosParams,
  CreateVideoPayload,
  UpdateVideoPayload
} from '@/domain/models/video.model'
import type { HttpClient } from '@/infrastructure/http/http-client'
import { ApiEndpoints } from '@/data/endpoints'

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

    const response = await this.httpClient.get<ApiResponse<VideoCategory[]>>(ApiEndpoints.VideoCategories.Base, {
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
    const response = await this.httpClient.post<ApiResponse<VideoCategory>>(ApiEndpoints.VideoCategories.Base, payload, {
      requiresAuth: true
    })
    return (response.data as unknown as { data?: VideoCategory })?.data || (response.data as unknown as VideoCategory)
  }

  async updateCategory(id: string, payload: UpdateVideoCategoryPayload): Promise<VideoCategory> {
    const response = await this.httpClient.put<ApiResponse<VideoCategory>>(ApiEndpoints.VideoCategories.ById(id), payload, {
      requiresAuth: true
    })
    return (response.data as unknown as { data?: VideoCategory })?.data || (response.data as unknown as VideoCategory)
  }

  async deleteCategory(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(ApiEndpoints.VideoCategories.ById(id), {
      requiresAuth: true
    })
    return Boolean(response.data ?? true)
  }

  async getAll(params?: GetVideosParams): Promise<PagginatedResult<VideoDto>> {
    const categoryId = (params?.videoCategoryId || params?.categoryId)?.trim() || undefined
    const response = await this.httpClient.get<ApiResponse<PagginatedResult<VideoDto>>>(ApiEndpoints.Videos.Base, {
      params: {
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 10,
        search: params?.search?.trim() || undefined,
        category: params?.category?.trim() || undefined,
        videoCategoryId: categoryId,
        categoryId: categoryId,
        isActive: params?.isActive,
        applyLanguageFilter: params?.applyLanguageFilter ?? false
      },
      requiresAuth: true
    })
    const raw = response as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      const inner = (raw as { data: unknown }).data
      if (inner && typeof inner === 'object' && 'items' in (inner as object)) {
        return inner as PagginatedResult<VideoDto>
      }
    }
    if (raw && typeof raw === 'object' && 'items' in (raw as object)) {
      return raw as PagginatedResult<VideoDto>
    }
    return {
      items: [],
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      totalPages: 1,
      totalCount: 0,
      hasPreviousPage: false,
      hasNextPage: false
    }
  }

  async getById(id: string): Promise<VideoDto> {
    const response = await this.httpClient.get<ApiResponse<VideoDto>>(ApiEndpoints.Videos.ById(id), {
      params: { applyLanguageFilter: false },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: VideoDto }).data
    }
    return raw as VideoDto
  }

  async create(payload: CreateVideoPayload): Promise<VideoDto> {
    const cleanPayload = {
      ...payload,
      categoryId: payload.categoryId ? payload.categoryId : null,
      thumbnailUrl: payload.thumbnailUrl ? payload.thumbnailUrl : null,
      videoUrl: payload.videoUrl ? payload.videoUrl : null
    }
    const response = await this.httpClient.post<ApiResponse<VideoDto>>(ApiEndpoints.Videos.Base, cleanPayload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: VideoDto }).data
    }
    return raw as VideoDto
  }

  async update(id: string, payload: UpdateVideoPayload): Promise<VideoDto> {
    const cleanPayload = {
      id,
      ...payload,
      categoryId: payload.categoryId ? payload.categoryId : null,
      thumbnailUrl: payload.thumbnailUrl ? payload.thumbnailUrl : null,
      videoUrl: payload.videoUrl ? payload.videoUrl : null
    }
    const response = await this.httpClient.put<ApiResponse<VideoDto>>(ApiEndpoints.Videos.ById(id), cleanPayload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: VideoDto }).data
    }
    return raw as VideoDto
  }

  async delete(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(ApiEndpoints.Videos.ById(id), {
      requiresAuth: true
    })
    return Boolean((response.data as unknown as { data?: boolean })?.data ?? true)
  }
}
