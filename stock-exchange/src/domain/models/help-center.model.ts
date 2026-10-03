export interface HelpCenterCategoryDto {
  id: string
  titleEn: string
  titleAr: string
}

export interface CreateHelpCenterCategoryPayload {
  titleEn: string
  titleAr: string
}

export interface UpdateHelpCenterCategoryPayload {
  id: string
  titleEn: string
  titleAr: string
}

export interface HelpCenterDto {
  id: string
  titleEn: string
  titleAr: string
  contentEn: string
  contentAr: string
  categoryId?: string | null
  displayOrder: number
}

export interface CreateHelpCenterPayload {
  titleEn: string
  titleAr: string
  contentEn: string
  contentAr: string
  categoryId?: string | null
}

export interface UpdateHelpCenterPayload {
  id: string
  titleEn: string
  titleAr: string
  contentEn: string
  contentAr: string
  categoryId?: string | null
  displayOrder?: number
}

export interface GetHelpCenterParams {
  categoryId?: string
  search?: string
  applyLanguageFilter?: boolean
}
