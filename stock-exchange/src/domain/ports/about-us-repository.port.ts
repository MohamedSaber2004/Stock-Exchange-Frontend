import type { AboutUsDto, UpdateAboutUsPayload } from '../models/about-us.model'

export interface IAboutUsRepository {
  get(applyLanguageFilter?: boolean): Promise<AboutUsDto>
  update(payload: UpdateAboutUsPayload): Promise<AboutUsDto>
}
