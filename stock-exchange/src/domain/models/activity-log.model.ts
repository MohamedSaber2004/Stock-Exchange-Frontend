import type { PagginatedResult } from './user.model'

export enum ActivityResourceType {
  UserRegistrations = 1,
  Users = 2,
  Articles = 3,
  Videos = 4,
  News = 5,
  HelpCenter = 6,
  SubscriptionPlans = 7,
  AboutUs = 8,
  TermsAndConditions = 9,
  PrivacyPolicy = 10
}

export interface ActivityLogDto {
  id: string
  formattedId: string
  userId?: string | null
  userName: string
  userEmail: string
  userProfilePictureUrl?: string | null
  action: string
  actionAr?: string | null
  actionEn?: string | null
  resourceType: ActivityResourceType | number
  resourceTypeArabic?: string
  resourceTypeEnglish?: string
  resourceTypeName?: string
  resourceTypeTitle?: string
  ipAddress: string
  device: string
  createdAt: string
  timeAgo?: string
  timeAgoArabic?: string
  timeAgoEnglish?: string
  details?: string | null
  detailsAr?: string | null
  detailsEn?: string | null
}

export interface SummaryCardDto {
  key: string
  titleAr: string
  titleEn: string
  title: string
  count: number
}

export interface ActivityLogsSummaryDto {
  totalLogs: number
  userRegistrationsCount: number
  contentOperationsCount: number
  articlesCount: number
  videosCount: number
  usersCount: number
  cards: SummaryCardDto[]
}

export interface ActivityLogsListResponse {
  logs: PagginatedResult<ActivityLogDto>
  summary: ActivityLogsSummaryDto
}

export interface GetActivityLogsParams {
  search?: string
  resourceType?: ActivityResourceType | number | string
  pageNumber?: number
  pageSize?: number
}
