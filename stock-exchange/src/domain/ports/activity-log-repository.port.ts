import type {
  ActivityLogDto,
  ActivityLogsListResponse,
  ActivityLogsSummaryDto,
  GetActivityLogsParams
} from '../models/activity-log.model'

export interface IActivityLogRepository {
  getAll(params?: GetActivityLogsParams): Promise<ActivityLogsListResponse>
  getSummary(): Promise<ActivityLogsSummaryDto>
  getById(id: string): Promise<ActivityLogDto>
}
