import type { ApiResponse, AppError } from '@/domain/models/common.model'
import {
  MediaType,
  type DownloadAttachmentPayload,
  type UpdateAttachmentPayload,
  type UploadAttachmentPayload,
  type UploadChunkPayload,
  type UploadChunkResultDto,
  type UploadChunkedFilePayload,
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

    const response = await this.httpClient.upload<ApiResponse<string>>(
      ApiEndpoints.Attachments.Upload,
      formData,
      {
        method: 'POST',
        requiresAuth: true,
        signal: payload.signal,
        onProgress: payload.onProgress,
      }
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

  async uploadChunk(payload: UploadChunkPayload): Promise<UploadChunkResultDto> {
    const formData = new FormData()
    formData.append('UploadId', payload.uploadId)
    formData.append('ChunkIndex', String(payload.chunkIndex))
    formData.append('TotalChunks', String(payload.totalChunks))
    formData.append('FileName', payload.fileName)
    formData.append('MediaType', String(payload.mediaType ?? MediaType.Video))
    formData.append('Place', String(payload.place ?? 0))
    formData.append('Chunk', payload.chunk, `${payload.chunkIndex}.part`)

    const response = await this.httpClient.upload<ApiResponse<UploadChunkResultDto>>(
      ApiEndpoints.Attachments.UploadChunk,
      formData,
      {
        method: 'POST',
        requiresAuth: true,
        signal: payload.signal,
        onProgress: payload.onProgress,
      }
    )

    if (!response.data && !response.success) {
      const err: AppError = {
        code: 'UPLOAD_CHUNK_FAILED',
        message: response.message || 'فشل رفع جزء من الملف',
        statusCode: response.statusCode || 400,
      }
      throw err
    }

    return response.data || {
      isCompleted: false,
      chunkIndex: payload.chunkIndex,
      totalChunks: payload.totalChunks,
    }
  }

  async uploadChunked(payload: UploadChunkedFilePayload): Promise<string> {
    const { file, mediaType = MediaType.Video, place = 0, onProgress, signal } = payload
    const chunkSize = payload.chunkSize || 5 * 1024 * 1024 // 5 MB per chunk
    const totalSize = file.size

    // If file is small (<= 5MB), standard single upload is faster
    if (totalSize <= chunkSize) {
      return await this.upload({
        file,
        mediaType,
        place,
        onProgress,
        signal,
      })
    }

    const totalChunks = Math.ceil(totalSize / chunkSize)
    const uploadId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `up_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    let completedFileName = ''
    let totalUploadedAcrossChunks = 0
    let lastTime = Date.now()
    let lastLoadedBytes = 0
    let smoothSpeed = 0

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (signal?.aborted) {
        throw {
          code: 'REQUEST_ABORTED',
          message: 'تم إلغاء رفع الملف',
          statusCode: 0,
        } as AppError
      }

      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, totalSize)
      const chunkBlob = file.slice(start, end)
      const currentChunkSize = end - start

      // Upload with retry (up to 3 attempts on temporary network failure)
      let attempt = 0
      let chunkSuccess = false
      let lastErr: unknown = null

      while (attempt < 3 && !chunkSuccess) {
        if (signal?.aborted) {
          throw {
            code: 'REQUEST_ABORTED',
            message: 'تم إلغاء رفع الملف',
            statusCode: 0,
          } as AppError
        }

        try {
          attempt++
          const res = await this.uploadChunk({
            uploadId,
            chunkIndex,
            totalChunks,
            fileName: file.name,
            mediaType,
            place,
            chunk: chunkBlob,
            signal,
            onProgress: (p) => {
              const currentChunkLoaded = p.loaded || 0
              const overallLoaded = Math.min(totalSize, totalUploadedAcrossChunks + currentChunkLoaded)
              const percentage = Math.min(99, Math.round((overallLoaded / totalSize) * 100))

              const now = Date.now()
              const timeDelta = (now - lastTime) / 1000
              if (timeDelta >= 0.25) {
                const bytesDelta = overallLoaded - lastLoadedBytes
                const instantSpeed = bytesDelta / timeDelta
                smoothSpeed = smoothSpeed === 0 ? instantSpeed : 0.7 * smoothSpeed + 0.3 * instantSpeed
                lastTime = now
                lastLoadedBytes = overallLoaded
              }

              const remainingBytes = Math.max(0, totalSize - overallLoaded)
              const etaSeconds =
                smoothSpeed > 0 ? Math.max(1, Math.round(remainingBytes / smoothSpeed)) : undefined

              onProgress?.({
                loaded: overallLoaded,
                total: totalSize,
                percentage,
                bytesPerSecond: smoothSpeed,
                etaSeconds,
              })
            },
          })

          totalUploadedAcrossChunks += currentChunkSize
          chunkSuccess = true

          if (res.isCompleted && res.storedFileName) {
            completedFileName = res.storedFileName
          }
        } catch (err: unknown) {
          lastErr = err
          const errCode = (err as { code?: string })?.code
          if (errCode === 'REQUEST_ABORTED' || signal?.aborted) {
            throw err
          }
          if (attempt < 3) {
            // Exponential backoff before retry (1s, 2s)
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
          }
        }
      }

      if (!chunkSuccess) {
        throw (
          lastErr || {
            code: 'CHUNK_UPLOAD_FAILED',
            message: `فشل رفع الجزء ${chunkIndex + 1} من ${totalChunks}`,
            statusCode: 0,
          }
        )
      }
    }

    onProgress?.({
      loaded: totalSize,
      total: totalSize,
      percentage: 100,
      bytesPerSecond: smoothSpeed,
      etaSeconds: 0,
    })

    return completedFileName
  }

  async uploadMultiple(payload: UploadMultipleAttachmentsPayload): Promise<string[]> {
    const formData = new FormData()
    payload.files.forEach((file) => {
      formData.append('Files', file)
    })
    formData.append('MediaType', String(payload.mediaType ?? MediaType.Image))
    formData.append('Place', String(payload.place ?? 0))

    const response = await this.httpClient.upload<ApiResponse<string>>(
      ApiEndpoints.Attachments.UploadMultiple,
      formData,
      {
        method: 'POST',
        requiresAuth: true,
        signal: payload.signal,
        onProgress: payload.onProgress,
      }
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

    const response = await this.httpClient.upload<ApiResponse<string>>(
      ApiEndpoints.Attachments.Update,
      formData,
      {
        method: 'PUT',
        requiresAuth: true,
        signal: payload.signal,
        onProgress: payload.onProgress,
      }
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
