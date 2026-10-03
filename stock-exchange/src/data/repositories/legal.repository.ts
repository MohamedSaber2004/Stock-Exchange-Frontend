import type { ApiResponse } from '@/domain/models/common.model'
import type {
  LegalDocumentDto,
  LegalSectionDto,
  UpdateLegalDocumentPayload
} from '@/domain/models/legal-content.model'
import type { ILegalRepository } from '@/domain/ports/legal-repository.port'
import type { HttpClient } from '@/infrastructure/http/http-client'

export class LegalRepository implements ILegalRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  private mapSection(raw: Record<string, unknown>): LegalSectionDto {
    return {
      id: String(raw.id ?? raw.Id ?? ''),
      titleEn: String(raw.titleEn ?? raw.TitleEn ?? ''),
      titleAr: String(raw.titleAr ?? raw.TitleAr ?? ''),
      contentEn: String(raw.contentEn ?? raw.ContentEn ?? ''),
      contentAr: String(raw.contentAr ?? raw.ContentAr ?? ''),
      displayOrder: Number(raw.displayOrder ?? raw.DisplayOrder ?? 0)
    }
  }

  private mapDocument(raw: Record<string, unknown>): LegalDocumentDto {
    const rawSections = (raw.sections ?? raw.Sections) as Record<string, unknown>[] | undefined
    const sections = Array.isArray(rawSections)
      ? rawSections.map(s => this.mapSection(s))
      : []

    return {
      id: String(raw.id ?? raw.Id ?? ''),
      titleEn: String(raw.titleEn ?? raw.TitleEn ?? ''),
      titleAr: String(raw.titleAr ?? raw.TitleAr ?? ''),
      descriptionEn: raw.descriptionEn != null || raw.DescriptionEn != null
        ? String(raw.descriptionEn ?? raw.DescriptionEn)
        : null,
      descriptionAr: raw.descriptionAr != null || raw.DescriptionAr != null
        ? String(raw.descriptionAr ?? raw.DescriptionAr)
        : null,
      sections
    }
  }

  // --- Terms & Conditions ---
  async getTerms(applyLanguageFilter: boolean = false): Promise<LegalDocumentDto> {
    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>('/terms-and-conditions', {
      params: { applyLanguageFilter },
      requiresAuth: true
    })
    return this.mapDocument(response.data || {})
  }

  async updateTerms(payload: UpdateLegalDocumentPayload): Promise<LegalDocumentDto> {
    const response = await this.httpClient.patch<ApiResponse<Record<string, unknown>>>('/terms-and-conditions', payload, {
      requiresAuth: true
    })
    return this.mapDocument(response.data || {})
  }

  async deleteTerms(id?: string): Promise<boolean> {
    const url = id ? `/terms-and-conditions/${id}` : '/terms-and-conditions'
    const response = await this.httpClient.delete<ApiResponse<boolean>>(url, {
      requiresAuth: true
    })
    return Boolean(response.data ?? true)
  }

  // --- Privacy Policy ---
  async getPrivacy(applyLanguageFilter: boolean = false): Promise<LegalDocumentDto> {
    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>('/privacy-policy', {
      params: { applyLanguageFilter },
      requiresAuth: true
    })
    return this.mapDocument(response.data || {})
  }

  async updatePrivacy(payload: UpdateLegalDocumentPayload): Promise<LegalDocumentDto> {
    const response = await this.httpClient.patch<ApiResponse<Record<string, unknown>>>('/privacy-policy', payload, {
      requiresAuth: true
    })
    return this.mapDocument(response.data || {})
  }

  async deletePrivacy(id?: string): Promise<boolean> {
    const url = id ? `/privacy-policy/${id}` : '/privacy-policy'
    const response = await this.httpClient.delete<ApiResponse<boolean>>(url, {
      requiresAuth: true
    })
    return Boolean(response.data ?? true)
  }
}
