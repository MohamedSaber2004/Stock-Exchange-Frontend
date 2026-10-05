export interface ArticleDto {
  id: string
  titleEn: string
  titleAr: string
  excerptEn: string
  excerptAr: string
  contentEn?: string
  contentAr?: string
  imageUrl?: string | null
  authorName: string
  readMinutes?: number
  publishedAt: string
  isFeaturedOnHome: boolean
  displayOrder: number
  isActive: boolean
  createdAt: string
  categoryId?: string | null
  articleCategoryId?: string | null
  categoryEnName?: string | null
  categoryArName?: string | null
  title?: string
  excerpt?: string
  content?: string
}

export interface GetArticlesParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  articleCategoryId?: string
  categoryId?: string
  isActive?: boolean
  applyLanguageFilter?: boolean
}

export interface CreateArticlePayload {
  titleEn: string
  titleAr: string
  excerptEn: string
  excerptAr: string
  contentEn?: string
  contentAr?: string
  imageUrl?: string | null
  authorName: string
  readMinutes?: number
  publishedAt?: string | null
  isFeaturedOnHome?: boolean
  displayOrder?: number
  isActive?: boolean
  categoryId?: string | null
}

export interface UpdateArticlePayload {
  titleEn: string
  titleAr: string
  excerptEn: string
  excerptAr: string
  contentEn?: string
  contentAr?: string
  imageUrl?: string | null
  authorName: string
  readMinutes?: number
  publishedAt?: string | null
  isFeaturedOnHome?: boolean
  displayOrder?: number
  isActive?: boolean
  categoryId?: string | null
}
