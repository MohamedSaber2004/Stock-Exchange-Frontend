export interface VideoDto {
  id: string
  titleEn: string
  titleAr: string
  thumbnailUrl?: string | null
  videoUrl?: string | null
  durationSeconds: number
  instructorName: string
  categoryEn: string
  categoryAr: string
  categoryId?: string | null
  videoCategoryId?: string | null
  categoryEnName?: string | null
  categoryArName?: string | null
  isPreviewable: boolean
  isFeaturedOnHome: boolean
  displayOrder: number
  isActive: boolean
  createdAt: string
  title?: string
  category?: string
}

export interface GetVideosParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  category?: string
  videoCategoryId?: string
  categoryId?: string
  isActive?: boolean
  applyLanguageFilter?: boolean
}
