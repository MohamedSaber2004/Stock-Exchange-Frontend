export interface VideoCategory {
  id: string
  categoryArName: string
  categoryEnName: string
  videosCount?: number
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
}

export interface CreateVideoCategoryPayload {
  categoryArName: string
  categoryEnName: string
}

export interface UpdateVideoCategoryPayload {
  id: string
  categoryArName: string
  categoryEnName: string
}
