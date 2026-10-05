import type { ApiResponse, AppError } from '@/domain/models/common.model'
import {
  MediaType,
  type DownloadAttachmentPayload,
  type UpdateAttachmentPayload,
  type UploadAttachmentPayload,
  type UploadMultipleAttachmentsPayload,
} from '@/domain/models/attachment.model'
import type { IAttachmentRepository } from '@/domain/ports/attachment-repository.port'
import type { HttpClient } from '@/infrastructure/http/http-client'
import type { TokenStore } from '@/infrastructure/storage/token-store'
import { resolveAttachmentUrl as resolveUrlHelper } from '@/utils/attachment'
import { ApiEndpoints } from '@/data/endpoints'

export class AttachmentRepository implements IAttachmentRepository {
  private httpClient: HttpClient
  private tokenStore: TokenStore

  constructor(httpClient: HttpClient, tokenStore: TokenStore) {
    this.httpClient = httpClient
    this.tokenStore = tokenStore
  }

  async upload(payload: UploadAttachmentPayload): Promise<string> {
    const formData = new FormData()
    formData.append('File', payload.file)
    formData.append('MediaType', String(payload.mediaType ?? MediaType.Image))
    formData.append('Place', String(payload.place ?? 0))

    const response = await this.httpClient.post<ApiResponse<string>>(
      ApiEndpoints.Attachments.Upload,
      formData,
      { requiresAuth: true }
    )

    if (!response.data && !response.success) {
      const err: AppError = {
        code: 'UPLOAD_FAILED',
        message: response.message || 'فشل رفع الملف',
        statusCode: response.statusCode || 400,
      }
      throw err
    }

    return response.data || ''
  }

  async uploadMultiple(payload: UploadMultipleAttachmentsPayload): Promise<string[]> {
    const formData = new FormData()
    payload.files.forEach((file) => {
      formData.append('Files', file)
    })
    formData.append('MediaType', String(payload.mediaType ?? MediaType.Image))
    formData.append('Place', String(payload.place ?? 0))

    const response = await this.httpClient.post<ApiResponse<string>>(
      ApiEndpoints.Attachments.UploadMultiple,
      formData,
      { requiresAuth: true }
    )

    if (!response.data && !response.success) {
      const err: AppError = {
        code: 'UPLOAD_MULTIPLE_FAILED',
        message: response.message || 'فشل رفع الملفات',
        statusCode: response.statusCode || 400,
      }
      throw err
    }

    const raw = response.data || ''
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async update(payload: UpdateAttachmentPayload): Promise<string> {
    const formData = new FormData()
    formData.append('OldFileName', payload.oldFileName)
    formData.append('File', payload.file)
    formData.append('MediaType', String(payload.mediaType ?? MediaType.Image))
    formData.append('Place', String(payload.place ?? 0))

    const response = await this.httpClient.put<ApiResponse<string>>(
      ApiEndpoints.Attachments.Update,
      formData,
      { requiresAuth: true }
    )

    if (!response.data && !response.success) {
      const err: AppError = {
        code: 'UPDATE_ATTACHMENT_FAILED',
        message: response.message || 'فشل تحديث الملف',
        statusCode: response.statusCode || 400,
      }
      throw err
    }

    return response.data || ''
  }

  resolveAttachmentUrl(fileName?: string | null): string {
    return resolveUrlHelper(fileName, this.httpClient.getBaseUrl())
  }

  getFileDownloadUrl(
    fileName: string,
    _mediaType: MediaType = MediaType.Image,
    _place: number = 0
  ): string {
    return this.resolveAttachmentUrl(fileName)
  }

  async download(payload: DownloadAttachmentPayload): Promise<Blob> {
    const downloadUrl = this.resolveAttachmentUrl(payload.fileName)
    const token = this.tokenStore.getAccessToken()

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const res = await fetch(downloadUrl, {
        method: 'GET',
        headers,
      })

      if (res.ok) {
        return await res.blob()
      }
    } catch {
      // Ignore and fallback to download endpoint
    }

    // Fallback to attachments API endpoint if direct file fetch fails
    const mediaType = payload.mediaType ?? MediaType.File
    const filePlace = payload.filePlace ?? 0
    const baseUrl = this.httpClient.getBaseUrl()
    const apiDownloadUrl = `${baseUrl}${ApiEndpoints.Attachments.Download}?FileName=${encodeURIComponent(
      payload.fileName
    )}&FilePlace=${filePlace}&MediaType=${mediaType}`

    const fallbackRes = await fetch(apiDownloadUrl, {
      method: 'GET',
      headers,
    })

    if (!fallbackRes.ok) {
      throw new Error(`Download failed with status ${fallbackRes.status}`)
    }

    return await fallbackRes.blob()
  }
}
