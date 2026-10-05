import type { AdminOverviewDto } from '../models/overview.model'

export interface IOverviewRepository {
  getOverview(): Promise<AdminOverviewDto>
}
