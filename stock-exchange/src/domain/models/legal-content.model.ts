export interface LegalSectionDto {
  id: string
  titleEn: string
  titleAr: string
  contentEn: string
  contentAr: string
  displayOrder: number
}

export interface LegalSectionRequest {
  titleEn?: string
  titleAr?: string
  contentEn?: string
  contentAr?: string
}

export interface LegalDocumentDto {
  id: string
  titleEn: string
  titleAr: string
  descriptionEn: string | null
  descriptionAr: string | null
  sections: LegalSectionDto[]
}

export interface UpdateLegalDocumentPayload {
  titleEn?: string
  titleAr?: string
  descriptionEn?: string | null
  descriptionAr?: string | null
  sections?: LegalSectionRequest[]
}
