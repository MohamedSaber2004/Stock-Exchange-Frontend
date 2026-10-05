export interface NewsDto {
  id: string
  titleEn: string
  titleAr: string
  summaryEn: string
  summaryAr: string
  contentEn?: string
  contentAr?: string
  imageUrl?: string | null
  categoryEn: string
  categoryAr: string
  publishedAt: string
  displayOrder: number
  isFeaturedOnHome: boolean
  isActive: boolean
  createdAt: string
  title?: string
  summary?: string
  content?: string
  category?: string
}

export interface GetNewsParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  isFeaturedOnHome?: boolean
  isActive?: boolean
  applyLanguageFilter?: boolean
}

export interface CreateNewsPayload {
  titleEn: string
  titleAr: string
  summaryEn: string
  summaryAr: string
  contentEn?: string
  contentAr?: string
  imageUrl?: string | null
  categoryEn?: string
  categoryAr?: string
  publishedAt?: string | null
  displayOrder?: number
  isFeaturedOnHome?: boolean
  isActive?: boolean
}

export interface UpdateNewsPayload {
  titleEn: string
  titleAr: string
  summaryEn: string
  summaryAr: string
  contentEn?: string
  contentAr?: string
  imageUrl?: string | null
  categoryEn?: string
  categoryAr?: string
  publishedAt?: string | null
  displayOrder?: number
  isFeaturedOnHome?: boolean
  isActive?: boolean
}
