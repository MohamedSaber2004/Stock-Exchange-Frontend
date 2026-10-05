import type { ApiResponse } from '@/domain/models/common.model'
import type {
  AdminOverviewDto,
  OverviewStatsDto,
  OverviewContentDistributionDto,
  OverviewTrendItemDto,
  OverviewCategorySummaryDto,
  OverviewActivityLogDto
} from '@/domain/models/overview.model'
import type { IOverviewRepository } from '@/domain/ports/overview-repository.port'
import type { HttpClient } from '@/infrastructure/http/http-client'
import { ApiEndpoints } from '@/data/endpoints'

export class OverviewRepository implements IOverviewRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  private mapStats(raw: Record<string, unknown>): OverviewStatsDto {
    return {
      totalUsers: Number(raw.totalUsers ?? raw.TotalUsers ?? 0),
      activeUsers: Number(raw.activeUsers ?? raw.ActiveUsers ?? 0),
      inactiveUsers: Number(raw.inactiveUsers ?? raw.InactiveUsers ?? 0),
      newUsersThisMonth: Number(raw.newUsersThisMonth ?? raw.NewUsersThisMonth ?? 0),
      totalArticles: Number(raw.totalArticles ?? raw.TotalArticles ?? 0),
      totalVideos: Number(raw.totalVideos ?? raw.TotalVideos ?? 0),
      totalNews: Number(raw.totalNews ?? raw.TotalNews ?? 0),
      totalServices: Number(raw.totalServices ?? raw.TotalServices ?? 0),
      totalExperts: Number(raw.totalExperts ?? raw.TotalExperts ?? 0),
      totalCountries: Number(raw.totalCountries ?? raw.TotalCountries ?? 0),
      totalPlans: Number(raw.totalPlans ?? raw.TotalPlans ?? 0),
      totalActivityLogs: Number(raw.totalActivityLogs ?? raw.TotalActivityLogs ?? 0)
    }
  }

  private mapContentDistribution(raw: Record<string, unknown>): OverviewContentDistributionDto {
    const articlesCount = Number(raw.articlesCount ?? raw.ArticlesCount ?? 0)
    const videosCount = Number(raw.videosCount ?? raw.VideosCount ?? 0)
    const newsCount = Number(raw.newsCount ?? raw.NewsCount ?? 0)
    const servicesCount = Number(raw.servicesCount ?? raw.ServicesCount ?? 0)
    const totalContentItems = Number(raw.totalContentItems ?? raw.TotalContentItems ?? (articlesCount + videosCount + newsCount + servicesCount))

    return {
      articlesCount,
      videosCount,
      newsCount,
      servicesCount,
      totalContentItems,
      articlesPercentage: Number(raw.articlesPercentage ?? raw.ArticlesPercentage ?? (totalContentItems > 0 ? (articlesCount / totalContentItems) * 100 : 0)),
      videosPercentage: Number(raw.videosPercentage ?? raw.VideosPercentage ?? (totalContentItems > 0 ? (videosCount / totalContentItems) * 100 : 0)),
      newsPercentage: Number(raw.newsPercentage ?? raw.NewsPercentage ?? (totalContentItems > 0 ? (newsCount / totalContentItems) * 100 : 0)),
      servicesPercentage: Number(raw.servicesPercentage ?? raw.ServicesPercentage ?? (totalContentItems > 0 ? (servicesCount / totalContentItems) * 100 : 0))
    }
  }

  private mapTrendItem(raw: Record<string, unknown>): OverviewTrendItemDto {
    return {
      date: String(raw.date ?? raw.Date ?? ''),
      dayName: String(raw.dayName ?? raw.DayName ?? ''),
      count: Number(raw.count ?? raw.Count ?? 0)
    }
  }

  private mapCategory(raw: Record<string, unknown>): OverviewCategorySummaryDto {
    return {
      id: String(raw.id ?? raw.Id ?? ''),
      name: String(raw.name ?? raw.Name ?? ''),
      nameAr: String(raw.nameAr ?? raw.NameAr ?? ''),
      nameEn: String(raw.nameEn ?? raw.NameEn ?? ''),
      count: Number(raw.count ?? raw.Count ?? 0)
    }
  }

  private mapActivityLog(raw: Record<string, unknown>): OverviewActivityLogDto {
    return {
      id: String(raw.id ?? raw.Id ?? ''),
      userId: raw.userId != null ? String(raw.userId ?? raw.UserId) : null,
      userName: String(raw.userName ?? raw.UserName ?? 'Admin'),
      userEmail: String(raw.userEmail ?? raw.UserEmail ?? ''),
      userProfilePictureUrl: raw.userProfilePictureUrl != null ? String(raw.userProfilePictureUrl ?? raw.UserProfilePictureUrl) : null,
      action: String(raw.action ?? raw.Action ?? ''),
      actionAr: raw.actionAr != null ? String(raw.actionAr ?? raw.ActionAr) : undefined,
      actionEn: raw.actionEn != null ? String(raw.actionEn ?? raw.ActionEn) : undefined,
      resourceType: String(raw.resourceType ?? raw.ResourceType ?? ''),
      createdAt: String(raw.createdAt ?? raw.CreatedAt ?? '')
    }
  }

  async getOverview(): Promise<AdminOverviewDto> {
    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>(
      ApiEndpoints.Overview.Base,
      {
        requiresAuth: true
      }
    )

    const raw = response.data || {}
    const rawStats = (raw.stats ?? raw.Stats ?? {}) as Record<string, unknown>
    const rawContentDist = (raw.contentDistribution ?? raw.ContentDistribution ?? {}) as Record<string, unknown>
    const rawUserTrend = Array.isArray(raw.userRegistrationTrend ?? raw.UserRegistrationTrend)
      ? ((raw.userRegistrationTrend ?? raw.UserRegistrationTrend) as Record<string, unknown>[])
      : []
    const rawActivityTrend = Array.isArray(raw.activityTrend ?? raw.ActivityTrend)
      ? ((raw.activityTrend ?? raw.ActivityTrend) as Record<string, unknown>[])
      : []
    const rawRecentActivities = Array.isArray(raw.recentActivities ?? raw.RecentActivities)
      ? ((raw.recentActivities ?? raw.RecentActivities) as Record<string, unknown>[])
      : []
    const rawTopArticles = Array.isArray(raw.topArticleCategories ?? raw.TopArticleCategories)
      ? ((raw.topArticleCategories ?? raw.TopArticleCategories) as Record<string, unknown>[])
      : []
    const rawTopVideos = Array.isArray(raw.topVideoCategories ?? raw.TopVideoCategories)
      ? ((raw.topVideoCategories ?? raw.TopVideoCategories) as Record<string, unknown>[])
      : []

    return {
      stats: this.mapStats(rawStats),
      contentDistribution: this.mapContentDistribution(rawContentDist),
      userRegistrationTrend: rawUserTrend.map(t => this.mapTrendItem(t)),
      activityTrend: rawActivityTrend.map(t => this.mapTrendItem(t)),
      recentActivities: rawRecentActivities.map(a => this.mapActivityLog(a)),
      topArticleCategories: rawTopArticles.map(c => this.mapCategory(c)),
      topVideoCategories: rawTopVideos.map(c => this.mapCategory(c))
    }
  }
}
