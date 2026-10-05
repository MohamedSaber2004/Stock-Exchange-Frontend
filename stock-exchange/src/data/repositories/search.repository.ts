import type { ApiResponse } from '@/domain/models/common.model'
import type { GlobalSearchResult, GlobalSearchItem, SearchItemType } from '@/domain/models/search.model'
import type { ISearchRepository } from '@/domain/ports/search-repository.port'
import type { HttpClient } from '@/infrastructure/http/http-client'
import { ApiEndpoints } from '@/data/endpoints'

export class SearchRepository implements ISearchRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  private mapItem(raw: Record<string, unknown>): GlobalSearchItem {
    return {
      id: String(raw.id ?? raw.Id ?? ''),
      title: String(raw.title ?? raw.Title ?? ''),
      subtitle: raw.subtitle != null || raw.Subtitle != null ? String(raw.subtitle ?? raw.Subtitle) : null,
      category: raw.category != null || raw.Category != null ? String(raw.category ?? raw.Category) : null,
      imageUrl: raw.imageUrl != null || raw.ImageUrl != null ? String(raw.imageUrl ?? raw.ImageUrl) : null,
      type: String(raw.type ?? raw.Type ?? 'article').toLowerCase() as SearchItemType,
      targetRoute: String(raw.targetRoute ?? raw.TargetRoute ?? ''),
      date: raw.date != null || raw.Date != null ? String(raw.date ?? raw.Date) : null,
      badge: raw.badge != null || raw.Badge != null ? String(raw.badge ?? raw.Badge) : null,
    }
  }

  private mapList(list: unknown): GlobalSearchItem[] {
    if (!Array.isArray(list)) return []
    return list.map((item) => this.mapItem(item as Record<string, unknown>))
  }

  async search(query: string, limit: number = 5): Promise<GlobalSearchResult> {
    const trimmed = query.trim()
    if (!trimmed) {
      return {
        query: '',
        totalCount: 0,
        items: [],
        articles: [],
        videos: [],
        news: [],
        users: [],
        services: [],
        experts: [],
        countries: [],
        helpCenter: [],
      }
    }

    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>(
      ApiEndpoints.Search.Global(trimmed, limit),
      {
        requiresAuth: true,
      }
    )

    const raw = response.data || {}
    const items = this.mapList(raw.items ?? raw.Items)
    const articles = this.mapList(raw.articles ?? raw.Articles)
    const videos = this.mapList(raw.videos ?? raw.Videos)
    const news = this.mapList(raw.news ?? raw.News)
    const users = this.mapList(raw.users ?? raw.Users)
    const services = this.mapList(raw.services ?? raw.Services)
    const experts = this.mapList(raw.experts ?? raw.Experts)
    const countries = this.mapList(raw.countries ?? raw.Countries)
    const helpCenter = this.mapList(raw.helpCenter ?? raw.HelpCenter)

    return {
      query: String(raw.query ?? raw.Query ?? trimmed),
      totalCount: Number(raw.totalCount ?? raw.TotalCount ?? items.length),
      items,
      articles,
      videos,
      news,
      users,
      services,
      experts,
      countries,
      helpCenter,
    }
  }
}
