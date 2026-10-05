export type SearchItemType =
  | 'article'
  | 'video'
  | 'news'
  | 'user'
  | 'service'
  | 'expert'
  | 'country'
  | 'help'
  | 'page'

export interface GlobalSearchItem {
  id: string
  title: string
  subtitle?: string | null
  category?: string | null
  imageUrl?: string | null
  type: SearchItemType
  targetRoute: string
  date?: string | null
  badge?: string | null
}

export interface GlobalSearchResult {
  query: string
  totalCount: number
  items: GlobalSearchItem[]
  articles: GlobalSearchItem[]
  videos: GlobalSearchItem[]
  news: GlobalSearchItem[]
  users: GlobalSearchItem[]
  services: GlobalSearchItem[]
  experts: GlobalSearchItem[]
  countries: GlobalSearchItem[]
  helpCenter: GlobalSearchItem[]
}
