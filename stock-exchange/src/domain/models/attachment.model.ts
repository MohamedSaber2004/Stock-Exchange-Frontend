export enum MediaType {
  Image = 0,
  Video = 1,
  Audio = 2,
  File = 3,
}

export enum FilePlace {
  General = 0,
}

export interface UploadAttachmentPayload {
  file: File
  mediaType?: MediaType
  place?: number
}

export interface UploadMultipleAttachmentsPayload {
  files: File[]
  mediaType?: MediaType
  place?: number
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
}

export interface AttachmentUploadResult {
  fileName: string
  url: string
  mediaType: MediaType
  size: number
}
