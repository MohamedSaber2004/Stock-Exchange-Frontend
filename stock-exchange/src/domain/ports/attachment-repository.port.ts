import type {
  DownloadAttachmentPayload,
  MediaType,
  UpdateAttachmentPayload,
  UploadAttachmentPayload,
  UploadMultipleAttachmentsPayload,
} from '../models/attachment.model'

export interface IAttachmentRepository {
  upload(payload: UploadAttachmentPayload): Promise<string>
  uploadMultiple(payload: UploadMultipleAttachmentsPayload): Promise<string[]>
  download(payload: DownloadAttachmentPayload): Promise<Blob>
  update(payload: UpdateAttachmentPayload): Promise<string>
  getFileDownloadUrl(fileName: string, mediaType?: MediaType, place?: number): string
  resolveAttachmentUrl(fileName?: string | null): string
}
