export interface VideoDto {
  id: string
  titleEn: string
  titleAr: string
  descriptionEn?: string
  descriptionAr?: string
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
  description?: string
  category?: string
  relatedVideos?: VideoDto[]
}

export interface GetVideosParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  category?: string
  relatedVideos?: VideoDto[]
  videoCategoryId?: string
  categoryId?: string
  isActive?: boolean
  applyLanguageFilter?: boolean
}

export interface CreateVideoPayload {
  titleEn: string
  titleAr: string
  descriptionEn?: string
  descriptionAr?: string
  thumbnailUrl?: string | null
  videoUrl?: string | null
  durationSeconds?: number
  instructorName: string
  categoryEn?: string
  categoryAr?: string
  isPreviewable?: boolean
  isFeaturedOnHome?: boolean
  displayOrder?: number
  isActive?: boolean
  categoryId?: string | null
}

export interface UpdateVideoPayload {
  titleEn: string
  titleAr: string
  descriptionEn?: string
  descriptionAr?: string
  thumbnailUrl?: string | null
  videoUrl?: string | null
  durationSeconds?: number
  instructorName: string
  categoryEn?: string
  categoryAr?: string
  isPreviewable?: boolean
  isFeaturedOnHome?: boolean
  displayOrder?: number
  isActive?: boolean
  categoryId?: string | null
}
