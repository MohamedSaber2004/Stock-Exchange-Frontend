export interface ExpertDto {
  id: string
  fullNameEn: string
  fullNameAr: string
  titleEn: string
  titleAr: string
  avatarUrl?: string | null
  displayOrder: number
  isFeaturedOnHome: boolean
  isActive: boolean
  createdAt: string
  fullName?: string
  title?: string
}

export interface GetExpertsParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  isFeaturedOnHome?: boolean
  isActive?: boolean
  applyLanguageFilter?: boolean
}

export interface CreateExpertPayload {
  fullNameEn: string
  fullNameAr: string
  titleEn: string
  titleAr: string
  avatarUrl?: string | null
  displayOrder?: number
  isFeaturedOnHome?: boolean
  isActive?: boolean
}

export interface UpdateExpertPayload {
  fullNameEn: string
  fullNameAr: string
  titleEn: string
  titleAr: string
  avatarUrl?: string | null
  displayOrder?: number
  isFeaturedOnHome?: boolean
  isActive?: boolean
}
