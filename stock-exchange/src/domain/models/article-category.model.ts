export interface ArticleCategory {
  id: string
  categoryArName: string
  categoryEnName: string
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
}

export interface CreateArticleCategoryPayload {
  categoryArName: string
  categoryEnName: string
}

export interface UpdateArticleCategoryPayload {
  id: string
  categoryArName: string
  categoryEnName: string
}
