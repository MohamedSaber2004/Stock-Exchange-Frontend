import type { ApiResponse } from '@/domain/models/common.model'
import type { PagginatedResult } from '@/domain/models/user.model'
import type {
  ArticleCategory,
  CreateArticleCategoryPayload,
  UpdateArticleCategoryPayload
} from '@/domain/models/article-category.model'
import type {
  ArticleDto,
  GetArticlesParams,
  CreateArticlePayload,
  UpdateArticlePayload
} from '@/domain/models/article.model'
import type { HttpClient } from '@/infrastructure/http/http-client'
import { ApiEndpoints } from '@/data/endpoints'

export class ArticleRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async getCategories(paramsOrFilter?: boolean | { search?: string; applyLanguageFilter?: boolean }): Promise<ArticleCategory[]> {
    let search: string | undefined
    let applyLanguageFilter = false

    if (typeof paramsOrFilter === 'boolean') {
      applyLanguageFilter = paramsOrFilter
    } else if (paramsOrFilter && typeof paramsOrFilter === 'object') {
      search = paramsOrFilter.search
      applyLanguageFilter = paramsOrFilter.applyLanguageFilter ?? false
    }

    const response = await this.httpClient.get<ApiResponse<ArticleCategory[]>>(ApiEndpoints.ArticleCategories.Base, {
      params: { search, applyLanguageFilter },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: ArticleCategory[] }).data)) {
      return (raw as { data: ArticleCategory[] }).data
    }
    return []
  }

  async createCategory(payload: CreateArticleCategoryPayload): Promise<ArticleCategory> {
    const response = await this.httpClient.post<ApiResponse<ArticleCategory>>(ApiEndpoints.ArticleCategories.Base, payload, {
      requiresAuth: true
    })
    return (response.data as unknown as { data?: ArticleCategory })?.data || (response.data as unknown as ArticleCategory)
  }

  async updateCategory(id: string, payload: UpdateArticleCategoryPayload): Promise<ArticleCategory> {
    const response = await this.httpClient.put<ApiResponse<ArticleCategory>>(ApiEndpoints.ArticleCategories.ById(id), payload, {
      requiresAuth: true
    })
    return (response.data as unknown as { data?: ArticleCategory })?.data || (response.data as unknown as ArticleCategory)
  }

  async deleteCategory(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(ApiEndpoints.ArticleCategories.ById(id), {
      requiresAuth: true
    })
    return Boolean(response.data ?? true)
  }

  async getAll(params?: GetArticlesParams): Promise<PagginatedResult<ArticleDto>> {
    const categoryId = (params?.articleCategoryId || params?.categoryId)?.trim() || undefined
    const response = await this.httpClient.get<ApiResponse<PagginatedResult<ArticleDto>>>(ApiEndpoints.Articles.Base, {
      params: {
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 10,
        search: params?.search?.trim() || undefined,
        articleCategoryId: categoryId,
        categoryId: categoryId,
        isActive: params?.isActive,
        applyLanguageFilter: params?.applyLanguageFilter ?? false
      },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: PagginatedResult<ArticleDto> }).data
    }
    return raw as PagginatedResult<ArticleDto>
  }

  async getById(id: string): Promise<ArticleDto> {
    const response = await this.httpClient.get<ApiResponse<ArticleDto>>(ApiEndpoints.Articles.ById(id), {
      params: { applyLanguageFilter: false },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: ArticleDto }).data
    }
    return raw as ArticleDto
  }

  async create(payload: CreateArticlePayload): Promise<ArticleDto> {
    const cleanPayload = {
      ...payload,
      categoryId: payload.categoryId ? payload.categoryId : null,
      imageUrl: payload.imageUrl ? payload.imageUrl : null
    }
    const response = await this.httpClient.post<ApiResponse<ArticleDto>>(ApiEndpoints.Articles.Base, cleanPayload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: ArticleDto }).data
    }
    return raw as ArticleDto
  }

  async update(id: string, payload: UpdateArticlePayload): Promise<ArticleDto> {
    const cleanPayload = {
      ...payload,
      categoryId: payload.categoryId ? payload.categoryId : null,
      imageUrl: payload.imageUrl ? payload.imageUrl : null
    }
    const response = await this.httpClient.put<ApiResponse<ArticleDto>>(ApiEndpoints.Articles.ById(id), cleanPayload, {
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as { data: ArticleDto }).data
    }
    return raw as ArticleDto
  }

  async delete(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(ApiEndpoints.Articles.ById(id), {
      requiresAuth: true
    })
    return Boolean((response.data as unknown as { data?: boolean })?.data ?? true)
  }
}
