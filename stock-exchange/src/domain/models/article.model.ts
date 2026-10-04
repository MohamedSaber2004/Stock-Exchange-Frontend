export interface ArticleDto {
  id: string
  titleEn: string
  titleAr: string
  excerptEn: string
  excerptAr: string
  imageUrl?: string | null
  authorName: string
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
