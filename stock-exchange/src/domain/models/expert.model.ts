export interface ExpertConsultationAreaDto {
  id?: string
  textEn: string
  textAr: string
  displayOrder?: number
  text?: string
}

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
  consultationAreas?: ExpertConsultationAreaDto[]
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
  consultationAreas?: ExpertConsultationAreaDto[]
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
  consultationAreas?: ExpertConsultationAreaDto[]
}
