import type { ApiResponse } from '@/domain/models/common.model'
import {
  ActivityResourceType,
  type ActivityLogDto,
  type ActivityLogsListResponse,
  type ActivityLogsSummaryDto,
  type GetActivityLogsParams,
  type SummaryCardDto
} from '@/domain/models/activity-log.model'
import type { IActivityLogRepository } from '@/domain/ports/activity-log-repository.port'
import type { HttpClient } from '@/infrastructure/http/http-client'
import { ApiEndpoints } from '@/data/endpoints'

export class ActivityLogRepository implements IActivityLogRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  private parseResourceType(val: unknown): ActivityResourceType {
    if (typeof val === 'number') return val as ActivityResourceType
    if (typeof val === 'string') {
      const num = Number(val)
      if (!isNaN(num)) return num as ActivityResourceType
      const mapped = (ActivityResourceType as unknown as Record<string, unknown>)[val]
      if (typeof mapped === 'number') return mapped as ActivityResourceType
    }
    return 0 as ActivityResourceType
  }

  private mapLogDto(raw: Record<string, unknown>): ActivityLogDto {
    const rawResourceType = raw.resourceType ?? raw.ResourceType ?? raw.resourceTypeName ?? raw.ResourceTypeName
    return {
      id: String(raw.id ?? raw.Id ?? ''),
      formattedId: String(raw.formattedId ?? raw.FormattedId ?? ''),
      userId: raw.userId != null ? String(raw.userId ?? raw.UserId) : null,
      userName: String(raw.userName ?? raw.UserName ?? ''),
      userEmail: String(raw.userEmail ?? raw.UserEmail ?? ''),
      userProfilePictureUrl: raw.userProfilePictureUrl != null 
        ? String(raw.userProfilePictureUrl ?? raw.UserProfilePictureUrl) 
        : null,
      action: String(raw.action ?? raw.Action ?? ''),
      actionAr: raw.actionAr != null ? String(raw.actionAr ?? raw.ActionAr) : undefined,
      actionEn: raw.actionEn != null ? String(raw.actionEn ?? raw.ActionEn) : undefined,
      resourceType: this.parseResourceType(rawResourceType),
      resourceTypeArabic: String(raw.resourceTypeArabic ?? raw.ResourceTypeArabic ?? ''),
      resourceTypeEnglish: String(raw.resourceTypeEnglish ?? raw.ResourceTypeEnglish ?? ''),
      resourceTypeName: String(raw.resourceTypeName ?? raw.ResourceTypeName ?? ''),
      resourceTypeTitle: String(raw.resourceTypeTitle ?? raw.ResourceTypeTitle ?? ''),
      ipAddress: String(raw.ipAddress ?? raw.IpAddress ?? ''),
      device: String(raw.device ?? raw.Device ?? ''),
      createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
      timeAgo: String(raw.timeAgo ?? raw.TimeAgo ?? ''),
      timeAgoArabic: String(raw.timeAgoArabic ?? raw.TimeAgoArabic ?? ''),
      timeAgoEnglish: String(raw.timeAgoEnglish ?? raw.TimeAgoEnglish ?? ''),
      details: raw.details != null ? String(raw.details ?? raw.Details) : undefined,
      detailsAr: raw.detailsAr != null ? String(raw.detailsAr ?? raw.DetailsAr) : undefined,
      detailsEn: raw.detailsEn != null ? String(raw.detailsEn ?? raw.DetailsEn) : undefined
    }
  }

  private mapSummaryDto(raw: Record<string, unknown>): ActivityLogsSummaryDto {
    const rawCards = Array.isArray(raw.cards ?? raw.Cards) ? (raw.cards ?? raw.Cards) as Record<string, unknown>[] : []
    const cards: SummaryCardDto[] = rawCards.map(c => ({
      key: String(c.key ?? c.Key ?? ''),
      titleAr: String(c.titleAr ?? c.TitleAr ?? ''),
      titleEn: String(c.titleEn ?? c.TitleEn ?? ''),
      title: String(c.title ?? c.Title ?? ''),
      count: Number(c.count ?? c.Count ?? 0)
    }))

    return {
      totalLogs: Number(raw.totalLogs ?? raw.TotalLogs ?? 0),
      userRegistrationsCount: Number(raw.userRegistrationsCount ?? raw.UserRegistrationsCount ?? 0),
      contentOperationsCount: Number(raw.contentOperationsCount ?? raw.ContentOperationsCount ?? 0),
      articlesCount: Number(raw.articlesCount ?? raw.ArticlesCount ?? 0),
      videosCount: Number(raw.videosCount ?? raw.VideosCount ?? 0),
      usersCount: Number(raw.usersCount ?? raw.UsersCount ?? 0),
      cards
    }
  }

  async getAll(params?: GetActivityLogsParams): Promise<ActivityLogsListResponse> {
    const queryParams: Record<string, string | number | boolean | undefined | null> = {}

    if (params?.search) queryParams.Search = params.search
    if (params?.resourceType !== undefined && params?.resourceType !== null && params?.resourceType !== '') {
      const parsed = this.parseResourceType(params.resourceType)
      queryParams.ResourceType = parsed > 0 ? parsed : params.resourceType
    }
    if (params?.pageNumber) queryParams.PageNumber = params.pageNumber
    if (params?.pageSize) queryParams.PageSize = params.pageSize

    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>(
      ApiEndpoints.ActivityLogs.Base,
      {
        params: queryParams,
        requiresAuth: true
      }
    )

    const rawData = response.data || {}
    const rawLogs = (rawData.logs ?? rawData.Logs ?? {}) as Record<string, unknown>
    const rawItems = Array.isArray(rawLogs.items ?? rawLogs.Items) 
      ? (rawLogs.items ?? rawLogs.Items) as Record<string, unknown>[] 
      : []

    const items = rawItems.map(item => this.mapLogDto(item))

    const rawSummary = (rawData.summary ?? rawData.Summary ?? {}) as Record<string, unknown>
    const summary = this.mapSummaryDto(rawSummary)

    return {
      logs: {
        items,
        pageNumber: Number(rawLogs.pageNumber ?? rawLogs.PageNumber ?? 1),
        pageSize: Number(rawLogs.pageSize ?? rawLogs.PageSize ?? 10),
        totalPages: Number(rawLogs.totalPages ?? rawLogs.TotalPages ?? 1),
        totalCount: Number(rawLogs.totalCount ?? rawLogs.TotalCount ?? items.length),
        hasPreviousPage: Boolean(rawLogs.hasPreviousPage ?? rawLogs.HasPreviousPage),
        hasNextPage: Boolean(rawLogs.hasNextPage ?? rawLogs.HasNextPage)
      },
      summary
    }
  }

  async getSummary(): Promise<ActivityLogsSummaryDto> {
    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>(
      ApiEndpoints.ActivityLogs.Summary,
      {
        requiresAuth: true
      }
    )
    return this.mapSummaryDto(response.data || {})
  }

  async getById(id: string): Promise<ActivityLogDto> {
    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>(
      ApiEndpoints.ActivityLogs.ById(id),
      {
        requiresAuth: true
      }
    )
    return this.mapLogDto(response.data || {})
  }
}
