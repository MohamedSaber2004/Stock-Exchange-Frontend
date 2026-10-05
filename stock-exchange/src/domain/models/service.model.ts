export interface ServiceDto {
  id: string
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  contentEn?: string
  contentAr?: string
  iconName: string
  imageUrl?: string | null
  linkRoute?: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  title?: string
  description?: string
  content?: string
}

export interface GetServicesParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  isActive?: boolean
  applyLanguageFilter?: boolean
}

export interface CreateServicePayload {
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  contentEn?: string
  contentAr?: string
  iconName?: string
  imageUrl?: string | null
  linkRoute?: string | null
  displayOrder?: number
  isActive?: boolean
}

export interface UpdateServicePayload {
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  contentEn?: string
  contentAr?: string
  iconName?: string
  imageUrl?: string | null
  linkRoute?: string | null
  displayOrder?: number
  isActive?: boolean
}
