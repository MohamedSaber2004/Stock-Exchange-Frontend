import type { GlobalSearchResult } from '../models/search.model'

export interface ISearchRepository {
  search(query: string, limit?: number): Promise<GlobalSearchResult>
}
