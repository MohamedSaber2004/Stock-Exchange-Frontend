import { resolveAttachmentUrl, getAttachmentUrl } from '@/utils/attachment'
import { coreServices } from '@/di'
import type { UploadAttachmentPayload, UpdateAttachmentPayload, DownloadAttachmentPayload } from '@/domain/models/attachment.model'

export function useAttachment() {
  const resolve = (fileName?: string | null): string => {
    return resolveAttachmentUrl(fileName, coreServices.httpClient.getBaseUrl())
  }

  const upload = async (payload: UploadAttachmentPayload): Promise<string> => {
    return await coreServices.attachments.upload(payload)
  }

  const update = async (payload: UpdateAttachmentPayload): Promise<string> => {
    return await coreServices.attachments.update(payload)
  }

  const download = async (payload: DownloadAttachmentPayload): Promise<Blob> => {
    return await coreServices.attachments.download(payload)
  }

  return {
    resolve,
    resolveUrl: resolve,
    getAttachmentUrl: resolve,
    resolveAttachmentUrl,
    upload,
    update,
    download,
  }
}
