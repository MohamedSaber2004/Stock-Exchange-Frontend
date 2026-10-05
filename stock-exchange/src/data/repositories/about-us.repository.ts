import type { ApiResponse } from '@/domain/models/common.model'
import type {
  AboutUsDto,
  AboutUsFeatureDto,
  UpdateAboutUsPayload
} from '@/domain/models/about-us.model'
import type { IAboutUsRepository } from '@/domain/ports/about-us-repository.port'
import type { HttpClient } from '@/infrastructure/http/http-client'
import { ApiEndpoints } from '@/data/endpoints'

export class AboutUsRepository implements IAboutUsRepository {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  private mapFeature(raw: Record<string, unknown>): AboutUsFeatureDto {
    return {
      id: String(raw.id ?? raw.Id ?? ''),
      titleEn: String(raw.titleEn ?? raw.TitleEn ?? ''),
      titleAr: String(raw.titleAr ?? raw.TitleAr ?? ''),
      descriptionEn: String(raw.descriptionEn ?? raw.DescriptionEn ?? ''),
      descriptionAr: String(raw.descriptionAr ?? raw.DescriptionAr ?? ''),
      category: String(raw.category ?? raw.Category ?? ''),
      displayOrder: Number(raw.displayOrder ?? raw.DisplayOrder ?? 0)
    }
  }

  private mapAboutUs(raw: Record<string, unknown>): AboutUsDto {
    const rawFeatures = (raw.features ?? raw.Features) as Record<string, unknown>[] | undefined
    const features = Array.isArray(rawFeatures)
      ? rawFeatures.map(f => this.mapFeature(f))
      : []

    return {
      id: String(raw.id ?? raw.Id ?? ''),
      storyEn: String(raw.storyEn ?? raw.StoryEn ?? ''),
      storyAr: String(raw.storyAr ?? raw.StoryAr ?? ''),
      missionEn: String(raw.missionEn ?? raw.MissionEn ?? ''),
      missionAr: String(raw.missionAr ?? raw.MissionAr ?? ''),
      visionEn: String(raw.visionEn ?? raw.VisionEn ?? ''),
      visionAr: String(raw.visionAr ?? raw.VisionAr ?? ''),
      supportEmail: raw.supportEmail != null || raw.SupportEmail != null
        ? String(raw.supportEmail ?? raw.SupportEmail)
        : null,
      features
    }
  }

  async get(applyLanguageFilter: boolean = false): Promise<AboutUsDto> {
    const response = await this.httpClient.get<ApiResponse<Record<string, unknown>>>(ApiEndpoints.AboutUs.Base, {
      params: { applyLanguageFilter },
      requiresAuth: true
    })
    return this.mapAboutUs(response.data || {})
  }

  async update(payload: UpdateAboutUsPayload): Promise<AboutUsDto> {
    const response = await this.httpClient.patch<ApiResponse<Record<string, unknown>>>(ApiEndpoints.AboutUs.Base, payload, {
      requiresAuth: true
    })
    return this.mapAboutUs(response.data || {})
  }
}
