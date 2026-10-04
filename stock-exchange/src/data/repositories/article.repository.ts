import type { ApiResponse } from '@/domain/models/common.model'
import type { PagginatedResult } from '@/domain/models/user.model'
import type { ArticleCategory } from '@/domain/models/article-category.model'
import type { ArticleDto, GetArticlesParams } from '@/domain/models/article.model'
import type { HttpClient } from '@/infrastructure/http/http-client'

export class ArticleRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async getCategories(applyLanguageFilter: boolean = false): Promise<ArticleCategory[]> {
    const response = await this.httpClient.get<ApiResponse<ArticleCategory[]>>('/article-categories', {
      params: { applyLanguageFilter },
      requiresAuth: true
    })
    const raw = response.data as unknown
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: ArticleCategory[] }).data)) {
      return (raw as { data: ArticleCategory[] }).data
    }
    return []
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
