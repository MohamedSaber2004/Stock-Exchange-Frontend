import type { ApiResponse } from '@/domain/models/common.model'
import type { PagginatedResult } from '@/domain/models/user.model'
import type {
  ArticleCategory,
  CreateArticleCategoryPayload,
  UpdateArticleCategoryPayload
} from '@/domain/models/article-category.model'
import type { ArticleDto, GetArticlesParams } from '@/domain/models/article.model'
import type { HttpClient } from '@/infrastructure/http/http-client'

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

    const response = await this.httpClient.get<ApiResponse<ArticleCategory[]>>('/article-categories', {
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
    const response = await this.httpClient.post<ApiResponse<ArticleCategory>>('/article-categories', payload, {
      requiresAuth: true
    })
    return (response.data as unknown as { data?: ArticleCategory })?.data || (response.data as unknown as ArticleCategory)
  }

  async updateCategory(id: string, payload: UpdateArticleCategoryPayload): Promise<ArticleCategory> {
    const response = await this.httpClient.put<ApiResponse<ArticleCategory>>(`/article-categories/${id}`, payload, {
      requiresAuth: true
    })
    return (response.data as unknown as { data?: ArticleCategory })?.data || (response.data as unknown as ArticleCategory)
  }

  async deleteCategory(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(`/article-categories/${id}`, {
      requiresAuth: true
    })
    return Boolean(response.data ?? true)
  }

  async getAll(params?: GetArticlesParams): Promise<PagginatedResult<ArticleDto>> {
    const response = await this.httpClient.get<ApiResponse<PagginatedResult<ArticleDto>>>('/articles', {
      params: {
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 10,
        search: params?.search,
        articleCategoryId: params?.articleCategoryId ?? params?.categoryId,
        isActive: params?.isActive,
        applyLanguageFilter: params?.applyLanguageFilter ?? false
      },
      requiresAuth: true
    })
    return response.data as unknown as PagginatedResult<ArticleDto>
  }
}

