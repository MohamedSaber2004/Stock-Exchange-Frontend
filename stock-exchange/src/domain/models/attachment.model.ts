export enum MediaType {
  Image = 0,
  Video = 1,
  Audio = 2,
  File = 3,
}

export enum FilePlace {
  General = 0,
}

export interface UploadProgressEvent {
  loaded: number // bytes transferred
  total: number // total file size in bytes
  percentage: number // 0 - 100
  bytesPerSecond?: number // upload speed in B/s
  etaSeconds?: number // estimated seconds remaining
}

export interface UploadAttachmentPayload {
  file: File
  mediaType?: MediaType
  place?: number
  onProgress?: (progress: UploadProgressEvent) => void
  signal?: AbortSignal
}

export interface UploadMultipleAttachmentsPayload {
  files: File[]
  mediaType?: MediaType
  place?: number
  onProgress?: (progress: UploadProgressEvent) => void
  signal?: AbortSignal
}

export interface DownloadAttachmentPayload {
  fileName: string
  filePlace?: number
  mediaType?: MediaType
}

export interface UpdateAttachmentPayload {
  oldFileName: string
  file: File
  mediaType?: MediaType
  place?: number
  onProgress?: (progress: UploadProgressEvent) => void
  signal?: AbortSignal
}

export interface AttachmentUploadResult {
  fileName: string
  url: string
  mediaType: MediaType
  size: number
}
