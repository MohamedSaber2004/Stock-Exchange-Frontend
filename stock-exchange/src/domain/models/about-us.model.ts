export interface AboutUsFeatureDto {
  id: string
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  category: string
  displayOrder: number
}

export interface AboutUsFeatureRequest {
  titleEn?: string
  titleAr?: string
  descriptionEn?: string
  descriptionAr?: string
  category?: string
}

export interface AboutUsDto {
  id: string
  storyEn: string
  storyAr: string
  missionEn: string
  missionAr: string
  visionEn: string
  visionAr: string
  supportEmail: string | null
  features: AboutUsFeatureDto[]
}

export interface UpdateAboutUsPayload {
  storyEn?: string
  storyAr?: string
  missionEn?: string
  missionAr?: string
  visionEn?: string
  visionAr?: string
  supportEmail?: string | null
  features?: AboutUsFeatureRequest[]
}
