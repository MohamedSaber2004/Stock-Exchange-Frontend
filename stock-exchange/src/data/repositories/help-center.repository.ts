import type { ApiResponse } from '@/domain/models/common.model'
import type {
  HelpCenterCategoryDto,
  CreateHelpCenterCategoryPayload,
  UpdateHelpCenterCategoryPayload,
  HelpCenterDto,
  CreateHelpCenterPayload,
  UpdateHelpCenterPayload,
  GetHelpCenterParams
} from '@/domain/models/help-center.model'
import type { IHelpCenterRepository } from '@/domain/ports/help-center-repository.port'
import type { HttpClient } from '@/infrastructure/http/http-client'

export class HelpCenterRepository implements IHelpCenterRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  private mapCategory(raw: Record<string, unknown>): HelpCenterCategoryDto {
    return {
      id: String(raw.id ?? raw.Id ?? ''),
      titleEn: String(raw.titleEn ?? raw.TitleEn ?? ''),
      titleAr: String(raw.titleAr ?? raw.TitleAr ?? '')
    }
  }

  private mapHelpCenter(raw: Record<string, unknown>): HelpCenterDto {
    return {
      id: String(raw.id ?? raw.Id ?? ''),
      titleEn: String(raw.titleEn ?? raw.TitleEn ?? ''),
      titleAr: String(raw.titleAr ?? raw.TitleAr ?? ''),
      contentEn: String(raw.contentEn ?? raw.ContentEn ?? ''),
      contentAr: String(raw.contentAr ?? raw.ContentAr ?? ''),
      categoryId: raw.categoryId != null || raw.CategoryId != null
        ? String(raw.categoryId ?? raw.CategoryId)
        : null,
      displayOrder: Number(raw.displayOrder ?? raw.DisplayOrder ?? 0)
    }
  }

  // --- Categories ---
  async getCategories(applyLanguageFilter: boolean = false): Promise<HelpCenterCategoryDto[]> {
    const response = await this.httpClient.get<ApiResponse<unknown>>('/help-center-categories', {
      params: { applyLanguageFilter },
      requiresAuth: true
    })
    const raw = response.data as Record<string, unknown>
    const list = Array.isArray(response.data)
      ? response.data
      : raw && Array.isArray(raw.data)
        ? raw.data
        : []
    return (list as Record<string, unknown>[]).map(item => this.mapCategory(item))
  }

  async getCategoryById(id: string, applyLanguageFilter: boolean = false): Promise<HelpCenterCategoryDto> {
    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>(`/help-center-categories/${id}`, {
      params: { applyLanguageFilter },
      requiresAuth: true
    })
    return this.mapCategory(response.data || {})
  }

  async createCategory(payload: CreateHelpCenterCategoryPayload): Promise<HelpCenterCategoryDto> {
    const response = await this.httpClient.post<ApiResponse<Record<string, unknown>>>('/help-center-categories', payload, {
      requiresAuth: true
    })
    return this.mapCategory(response.data || {})
  }

  async updateCategory(id: string, payload: UpdateHelpCenterCategoryPayload): Promise<HelpCenterCategoryDto> {
    const body = { ...payload, id }
    const response = await this.httpClient.put<ApiResponse<Record<string, unknown>>>(`/help-center-categories/${id}`, body, {
      requiresAuth: true
    })
    return this.mapCategory(response.data || {})
  }

  async deleteCategory(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(`/help-center-categories/${id}`, {
      requiresAuth: true
    })
    return Boolean(response.data ?? true)
  }

  // --- Help Center Items ---
  async getAll(params?: GetHelpCenterParams): Promise<HelpCenterDto[]> {
    const queryParams: Record<string, string | number | boolean | undefined | null> = {}
    if (params?.categoryId) queryParams.CategoryId = params.categoryId
    if (params?.search) queryParams.Search = params.search
    queryParams.applyLanguageFilter = params?.applyLanguageFilter ?? false

    const response = await this.httpClient.get<ApiResponse<unknown>>('/help-center', {
      params: queryParams,
      requiresAuth: true
    })
    const raw = response.data as Record<string, unknown>
    const list = Array.isArray(response.data)
      ? response.data
      : raw && Array.isArray(raw.data)
        ? raw.data
        : []
    return (list as Record<string, unknown>[]).map(item => this.mapHelpCenter(item))
  }

  async getById(id: string, applyLanguageFilter: boolean = false): Promise<HelpCenterDto> {
    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>(`/help-center/${id}`, {
      params: { applyLanguageFilter },
      requiresAuth: true
    })
    return this.mapHelpCenter(response.data || {})
  }

  async create(payload: CreateHelpCenterPayload): Promise<HelpCenterDto> {
    const response = await this.httpClient.post<ApiResponse<Record<string, unknown>>>('/help-center', payload, {
      requiresAuth: true
    })
    return this.mapHelpCenter(response.data || {})
  }

  async update(id: string, payload: UpdateHelpCenterPayload): Promise<HelpCenterDto> {
    const body = { ...payload, id }
    const response = await this.httpClient.put<ApiResponse<Record<string, unknown>>>(`/help-center/${id}`, body, {
      requiresAuth: true
    })
    return this.mapHelpCenter(response.data || {})
  }

  async delete(id: string): Promise<boolean> {
    const response = await this.httpClient.delete<ApiResponse<boolean>>(`/help-center/${id}`, {
      requiresAuth: true
    })
    return Boolean(response.data ?? true)
  }
}
