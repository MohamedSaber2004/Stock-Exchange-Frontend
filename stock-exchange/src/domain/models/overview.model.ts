export interface OverviewStatsDto {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  newUsersThisMonth: number
  totalArticles: number
  totalVideos: number
  totalNews: number
  totalServices: number
  totalExperts: number
  totalCountries: number
  totalPlans: number
  totalActivityLogs: number
}

export interface OverviewContentDistributionDto {
  articlesCount: number
  videosCount: number
  newsCount: number
  servicesCount: number
  totalContentItems: number
  articlesPercentage: number
  videosPercentage: number
  newsPercentage: number
  servicesPercentage: number
}

export interface OverviewTrendItemDto {
  date: string
  dayName: string
  count: number
}

export interface OverviewCategorySummaryDto {
  id: string
  name: string
  nameAr: string
  nameEn: string
  count: number
}

export interface OverviewActivityLogDto {
  id: string
  userId: string | null
  userName: string
  userEmail: string
  userProfilePictureUrl: string | null
  action: string
  actionAr?: string
  actionEn?: string
  resourceType: string
  createdAt: string
}

export interface AdminOverviewDto {
  stats: OverviewStatsDto
  contentDistribution: OverviewContentDistributionDto
  userRegistrationTrend: OverviewTrendItemDto[]
  activityTrend: OverviewTrendItemDto[]
  recentActivities: OverviewActivityLogDto[]
  topArticleCategories: OverviewCategorySummaryDto[]
  topVideoCategories: OverviewCategorySummaryDto[]
}
