<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Film, X, RefreshCw, Camera, CheckCircle2 } from 'lucide-vue-next'
import { useLocale } from '@/composables/useLocale'
import UploadProgressBar from './UploadProgressBar.vue'
import { coreServices } from '@/di'
import { MediaType, FilePlace } from '@/domain/models/attachment.model'
import { extractApiErrors } from '@/domain/models/common.model'
import { resolveAttachmentUrl, isStaticUrl } from '@/utils/attachment'

interface Props {
  modelValue?: string // Stored backend video attachment file name
  thumbnailUrl?: string // Stored backend thumbnail attachment file name
  durationSeconds?: number
  label?: string
  hint?: string
  maxSizeBytes?: number // e.g. 2GB default (supports up to 1-hour videos)
  maxDurationSeconds?: number // e.g. 3600 (1 hour in seconds)
  autoCaptureThumbnail?: boolean // default true
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  thumbnailUrl: '',
  durationSeconds: 0,
  label: '',
  hint: '',
  maxSizeBytes: 2 * 1024 * 1024 * 1024, // 2GB default (supports videos up to 1 hour)
  maxDurationSeconds: 3600, // 3600 seconds = 1 hour
  autoCaptureThumbnail: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:thumbnailUrl', value: string): void
  (e: 'update:durationSeconds', value: number): void
  (e: 'file-selected', file: File): void
  (e: 'upload-success', payload: { fileName: string; duration: number; file: File }): void
  (e: 'thumbnail-captured', payload: { file: File; dataUrl: string; attachmentName?: string }): void
}>()

const { isAr } = useLocale()

const fileInputRef = ref<HTMLInputElement | null>(null)
const videoPlayerRef = ref<HTMLVideoElement | null>(null)
const isDragging = ref(false)

// Upload state
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadedBytes = ref(0)
const uploadSpeed = ref(0)
const uploadEta = ref(0)
const uploadFileName = ref('')
const uploadFileSize = ref(0)
const uploadStatus = ref<'uploading' | 'processing' | 'success' | 'error'>('uploading')
const uploadError = ref('')
const uploadErrorHint = ref('')
const uploadAbortController = ref<AbortController | null>(null)

// Local preview URL (blob: during/immediately after file selection)
const localPreviewUrl = ref<string>('')
const selectedFile = ref<File | null>(null)

// Capturing thumbnail state
const isCapturingThumbnail = ref(false)
const thumbnailCapturedSuccess = ref(false)

const resolvedVideoUrl = computed(() => {
  if (localPreviewUrl.value) return localPreviewUrl.value
  if (!props.modelValue || isStaticUrl(props.modelValue)) return ''
  return resolveAttachmentUrl(props.modelValue)
})

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '00:00'
  const totalSecs = Math.round(seconds)
  const hrs = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024) {
    const gb = bytes / (1024 * 1024 * 1024)
    const formatted = gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)
    return isAr.value ? `${formatted} جيجابايت` : `${formatted} GB`
  }
  const mb = bytes / (1024 * 1024)
  const formatted = mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1)
  return isAr.value ? `${formatted} ميجابايت` : `${formatted} MB`
}

const defaultLabel = computed(() => {
  return props.label || (isAr.value ? 'ملف الفيديو' : 'Video File')
})

const defaultHint = computed(() => {
  if (props.hint) return props.hint
  const sizeText = formatFileSize(props.maxSizeBytes)
  const durationText =
    props.maxDurationSeconds && props.maxDurationSeconds > 0
      ? isAr.value
        ? `مدة تصل لـ ${formatDuration(props.maxDurationSeconds)}`
        : `up to ${formatDuration(props.maxDurationSeconds)}`
      : ''
  const details = [durationText, sizeText].filter(Boolean).join(' / ')
  return isAr.value
    ? `صيغ الفيديو المدعومة: MP4, MOV, MKV, AVI (${details})`
    : `Supported video formats: MP4, MOV, MKV, AVI (${details})`
})

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const safelyDetachAndRevoke = (videoEl: HTMLVideoElement | null, urlToRevoke?: string) => {
  if (videoEl) {
    try {
      videoEl.pause()
      videoEl.removeAttribute('src')
      videoEl.load()
    } catch {
      // ignore
    }
  }
  if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(urlToRevoke)
      } catch {
        // ignore
      }
    }, 1000)
  }
}

const cancelUpload = () => {
  if (uploadAbortController.value) {
    uploadAbortController.value.abort()
    uploadAbortController.value = null
  }
  isUploading.value = false
  uploadProgress.value = 0
  uploadedBytes.value = 0
  uploadSpeed.value = 0
  uploadEta.value = 0
  uploadFileName.value = ''
  uploadFileSize.value = 0
  uploadError.value = ''
  uploadErrorHint.value = ''
  if (localPreviewUrl.value) {
    const url = localPreviewUrl.value
    localPreviewUrl.value = ''
    safelyDetachAndRevoke(videoPlayerRef.value, url)
  }
  selectedFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const retryUpload = () => {
  if (selectedFile.value) {
    processFile(selectedFile.value)
  } else {
    triggerUpload()
  }
}

const removeVideo = () => {
  cancelUpload()
  emit('update:modelValue', '')
  emit('update:durationSeconds', 0)
}

const onVideoMetadataLoaded = () => {
  const video = videoPlayerRef.value
  if (video && !isNaN(video.duration) && video.duration > 0) {
    const calculatedSecs = Math.round(video.duration)
    emit('update:durationSeconds', calculatedSecs)
  }
}

// Extract a frame from a File or URL as a thumbnail
const extractThumbnailFromFile = (
  source: File | string,
  seekTime = 1
): Promise<{ file: File; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    const isBlobCreated = typeof source !== 'string'
    const url = typeof source === 'string' ? source : URL.createObjectURL(source)
    video.src = url

    let hasSeeked = false

    const cleanup = () => {
      video.onloadedmetadata = null
      video.onseeked = null
      video.onerror = null
      safelyDetachAndRevoke(video, isBlobCreated ? url : undefined)
    }

    video.onloadedmetadata = () => {
      const targetTime = Math.min(
        seekTime,
        video.duration > 0.5 ? video.duration / 2 : 0.1
      )
      video.currentTime = targetTime
    }

    video.onseeked = () => {
      if (hasSeeked) return
      hasSeeked = true

      // Asynchronously process frame to prevent blocking seeked event loop
      setTimeout(() => {
        try {
          const originalWidth = video.videoWidth || 640
          const originalHeight = video.videoHeight || 360
          // Scale to max 640px width for fast, lightweight thumbnail capture
          const maxWidth = 640
          const scale = Math.min(1, maxWidth / originalWidth)
          const width = Math.max(1, Math.round(originalWidth * scale))
          const height = Math.max(1, Math.round(originalHeight * scale))

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            cleanup()
            return reject(new Error('Canvas context unavailable'))
          }
          ctx.drawImage(video, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              cleanup()
              if (!blob) return reject(new Error('Blob conversion failed'))
              const thumbFile = new File([blob], `thumb_${Date.now()}.jpg`, {
                type: 'image/jpeg',
              })
              const previewUrl = URL.createObjectURL(blob)
              resolve({ file: thumbFile, dataUrl: previewUrl })
            },
            'image/jpeg',
            0.8
          )
        } catch (err) {
          cleanup()
          reject(err)
        }
      }, 0)
    }

    video.onerror = (err) => {
      cleanup()
      reject(err)
    }
  })
}

// Extract a frame from the current video element, convert to File, and upload as thumbnail
const captureThumbnail = async () => {
  const video = videoPlayerRef.value
  if (!video) return

  const originalWidth = video.videoWidth || 640
  const originalHeight = video.videoHeight || 360
  if (originalWidth === 0 || originalHeight === 0) return

  try {
    isCapturingThumbnail.value = true
    const maxWidth = 640
    const scale = Math.min(1, maxWidth / originalWidth)
    const width = Math.max(1, Math.round(originalWidth * scale))
    const height = Math.max(1, Math.round(originalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, width, height)

    await new Promise<void>((resolveBlob) => {
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            resolveBlob()
            return
          }
          try {
            const thumbFile = new File([blob], `thumb_${Date.now()}.jpg`, { type: 'image/jpeg' })
            const dataUrl = URL.createObjectURL(blob)

            // Upload thumbnail to backend attachments endpoint
            const attachmentName = await coreServices.attachments.upload({
              file: thumbFile,
              mediaType: MediaType.Image,
              place: FilePlace.General,
            })

            thumbnailCapturedSuccess.value = true
            setTimeout(() => {
              thumbnailCapturedSuccess.value = false
            }, 2500)

            emit('update:thumbnailUrl', attachmentName)
            emit('thumbnail-captured', {
              file: thumbFile,
              dataUrl,
              attachmentName,
            })
          } catch (uploadErr) {
            console.error('Failed to capture video thumbnail:', uploadErr)
          } finally {
            resolveBlob()
          }
        },
        'image/jpeg',
        0.8
      )
    })
  } catch (err) {
    console.error('Failed to capture video thumbnail:', err)
  } finally {
    isCapturingThumbnail.value = false
  }
}

const getVideoMetadata = (source: File | string): Promise<{ duration: number }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    const isBlobCreated = typeof source !== 'string'
    const url = typeof source === 'string' ? source : URL.createObjectURL(source)
    video.src = url
    let finished = false
    const finish = (duration: number) => {
      if (!finished) {
        finished = true
        video.onloadedmetadata = null
        video.onerror = null
        safelyDetachAndRevoke(video, isBlobCreated ? url : undefined)
        resolve({ duration })
      }
    }
    video.onloadedmetadata = () => {
      finish(video.duration || 0)
    }
    video.onerror = () => {
      finish(0)
    }
    setTimeout(() => finish(0), 4000)
  })
}

const processFile = async (file: File) => {
  const validExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.webm']
  const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  const isVideo = file.type.startsWith('video/') || validExtensions.includes(fileExt)

  if (!isVideo) {
    uploadStatus.value = 'error'
    uploadError.value = isAr.value
      ? 'الملف المحدد ليس ملف فيديو صالح'
      : 'Selected file is not a valid video file'
    isUploading.value = true
    uploadFileName.value = file.name
    uploadFileSize.value = file.size
    return
  }

  if (file.size > props.maxSizeBytes) {
    uploadStatus.value = 'error'
    uploadError.value = isAr.value
      ? `حجم الفيديو كبير جداً، الحد الأقصى هو ${formatFileSize(props.maxSizeBytes)}`
      : `File too large, max size is ${formatFileSize(props.maxSizeBytes)}`
    isUploading.value = true
    uploadFileName.value = file.name
    uploadFileSize.value = file.size
    return
  }

  // Set local blob preview for immediate feedback
  if (localPreviewUrl.value) {
    const oldUrl = localPreviewUrl.value
    safelyDetachAndRevoke(videoPlayerRef.value, oldUrl)
  }
  const blobUrl = URL.createObjectURL(file)
  localPreviewUrl.value = blobUrl
  selectedFile.value = file
  emit('file-selected', file)

  // Read and validate duration before upload using shared blobUrl
  const meta = await getVideoMetadata(blobUrl)
  if (meta.duration > 0) {
    const detectedSecs = Math.round(meta.duration)
    emit('update:durationSeconds', detectedSecs)

    if (props.maxDurationSeconds && props.maxDurationSeconds > 0 && meta.duration > props.maxDurationSeconds + 5) {
      uploadStatus.value = 'error'
      uploadError.value = isAr.value
        ? `مدة الفيديو (${formatDuration(meta.duration)}) تتجاوز الحد الأقصى المسموح (${formatDuration(props.maxDurationSeconds)} - ساعة واحدة)`
        : `Video duration (${formatDuration(meta.duration)}) exceeds maximum allowed limit (${formatDuration(props.maxDurationSeconds)})`
      isUploading.value = true
      uploadFileName.value = file.name
      uploadFileSize.value = file.size
      return
    }
  }

  // Auto-capture cover frame using shared blobUrl
  if (props.autoCaptureThumbnail) {
    isCapturingThumbnail.value = true
    extractThumbnailFromFile(blobUrl, 1.0)
      .then(async ({ file: thumbFile, dataUrl }) => {
        try {
          const thumbAttachmentName = await coreServices.attachments.upload({
            file: thumbFile,
            mediaType: MediaType.Image,
            place: FilePlace.General,
          })
          emit('update:thumbnailUrl', thumbAttachmentName)
          emit('thumbnail-captured', {
            file: thumbFile,
            dataUrl,
            attachmentName: thumbAttachmentName,
          })
          thumbnailCapturedSuccess.value = true
          setTimeout(() => {
            thumbnailCapturedSuccess.value = false
          }, 3000)
        } catch (thumbErr) {
          console.error('Failed to auto-upload video thumbnail:', thumbErr)
        } finally {
          isCapturingThumbnail.value = false
        }
      })
      .catch((err) => {
        console.warn('Auto thumbnail extraction failed:', err)
        isCapturingThumbnail.value = false
      })
  }

  // Start real backend upload with real progress tracking
  isUploading.value = true
  uploadStatus.value = 'uploading'
  uploadProgress.value = 0
  uploadedBytes.value = 0
  uploadSpeed.value = 0
  uploadEta.value = 0
  uploadFileName.value = file.name
  uploadFileSize.value = file.size
  uploadError.value = ''
  uploadErrorHint.value = ''

  if (uploadAbortController.value) {
    uploadAbortController.value.abort()
  }
  const controller = new AbortController()
  uploadAbortController.value = controller

  try {
    const savedFileName = await coreServices.attachments.uploadChunked({
      file,
      mediaType: MediaType.Video,
      place: FilePlace.General,
      signal: controller.signal,
      onProgress: (p) => {
        uploadProgress.value = p.percentage
        uploadedBytes.value = p.loaded
        uploadSpeed.value = p.bytesPerSecond || 0
        uploadEta.value = p.etaSeconds || 0
        if (p.percentage >= 99) {
          uploadStatus.value = 'processing'
        }
      },
    })

    uploadProgress.value = 100
    uploadStatus.value = 'success'

    // Update parent model with the saved attachment name returned by backend
    emit('update:modelValue', savedFileName)
    emit('upload-success', {
      fileName: savedFileName,
      duration: props.durationSeconds,
      file,
    })

    setTimeout(() => {
      isUploading.value = false
      uploadProgress.value = 0
    }, 600)
  } catch (err: unknown) {
    uploadStatus.value = 'error'
    const errorDetails = extractApiErrors(err)
    const errCode = (err as { code?: string })?.code || ''
    const errStatus =
      (err as { statusCode?: number; status?: number })?.statusCode ||
      (err as { status?: number })?.status ||
      errorDetails.statusCode

    // Diagnostic messages for HTTP 405 Method Not Allowed and payload size limits
    if (errStatus === 405 || errCode === 'HTTP_405') {
      uploadError.value = isAr.value
        ? 'الخادم رفض طريقة الطلب أو حجم ملف الفيديو (خطأ 405 Method Not Allowed).'
        : 'Server rejected the upload request or body size (Error 405 Method Not Allowed).'
      uploadErrorHint.value = isAr.value
        ? 'السبب المحتمل: عدم تفعيل معالجة CORS preflight (OPTIONS) على السيرفر. يرجى التأكد من مسار الـ Proxy وتفعيل CORS.'
        : 'Likely cause: CORS preflight (OPTIONS) rejected by the backend server. Verify API proxy configuration.'
    } else if (errStatus === 413 || errCode === 'HTTP_413') {
      uploadError.value = isAr.value
        ? 'حجم الفيديو كبير جداً ويتجاوز الحد الأقصى للخادم (413 Payload Too Large).'
        : 'Video file size exceeds server maximum limit (413 Payload Too Large).'
      uploadErrorHint.value = isAr.value
        ? 'يرجى ضغط ملف الفيديو أو اختيار ملف أصغر حجماً.'
        : 'Please compress the video file or choose a smaller file.'
    } else if (errCode === 'REQUEST_ABORTED') {
      uploadError.value = isAr.value ? 'تم إلغاء رفع الفيديو' : 'Video upload was cancelled'
      uploadErrorHint.value = ''
    } else if (errCode === 'UPLOAD_TIMEOUT') {
      uploadError.value = isAr.value
        ? 'انتهت مهلة رفع أحد أجزاء الفيديو بسبب بطء الاتصال'
        : 'Chunk upload timed out due to slow connection'
      uploadErrorHint.value = isAr.value
        ? 'يمكنك النقر على "إعادة المحاولة" للمتابعة من جديد.'
        : 'Click "Retry" to attempt the upload again.'
    } else if (errCode === 'CHUNK_UPLOAD_FAILED') {
      uploadError.value =
        errorDetails.generalMessage ||
        (isAr.value ? 'تعذر رفع أجزاء الفيديو بسبب انقطاع الاتصال' : 'Failed to upload video chunks due to connection issue')
      uploadErrorHint.value = isAr.value
        ? 'يمكنك النقر على "إعادة المحاولة" لإعادة رفع الأجزاء المتبقية.'
        : 'You can click "Retry" to continue uploading remaining chunks.'
    } else {
      uploadError.value =
        errorDetails.generalMessage ||
        (isAr.value ? 'فشل رفع ملف الفيديو إلى الخادم' : 'Failed to upload video file')
      uploadErrorHint.value = isAr.value
        ? 'يرجى التأكد من اتصال الإنترنت أو النقر على "إعادة المحاولة".'
        : 'Please check your internet connection or click "Retry".'
    }
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processFile(event.dataTransfer.files[0])
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    triggerUpload()
  }
}

onUnmounted(() => {
  if (uploadAbortController.value) {
    uploadAbortController.value.abort()
  }
  if (localPreviewUrl.value) {
    const url = localPreviewUrl.value
    localPreviewUrl.value = ''
    safelyDetachAndRevoke(videoPlayerRef.value, url)
  }
})
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <!-- Header Label -->
    <div class="flex items-center justify-between">
      <label v-if="defaultLabel" class="text-xs font-bold text-slate-700">
        {{ defaultLabel }} <span class="text-rose-500">*</span>
      </label>
      <span v-if="hint" class="text-[11px] text-slate-400">
        {{ defaultHint }}
      </span>
    </div>

    <!-- Hidden Native File Input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
      class="hidden"
      tabindex="-1"
      aria-hidden="true"
      @change="handleFileSelect"
    />

    <!-- Upload In Progress Bar -->
    <div v-if="isUploading" class="w-full">
      <UploadProgressBar
        :progress="uploadProgress"
        :file-name="uploadFileName"
        :file-size="uploadFileSize"
        :uploaded-bytes="uploadedBytes"
        :bytes-per-second="uploadSpeed"
        :eta-seconds="uploadEta"
        :status="uploadStatus"
        :error-message="uploadError"
        :error-hint="uploadErrorHint"
        :can-cancel="uploadStatus === 'uploading'"
        :can-retry="uploadStatus === 'error'"
        media-type="video"
        @cancel="cancelUpload"
        @retry="retryUpload"
        @remove="cancelUpload"
      />
    </div>

    <!-- Dropzone (When No Video and Not Uploading) -->
    <div
      v-else-if="!resolvedVideoUrl"
      role="button"
      tabindex="0"
      :aria-label="isAr ? 'انقر أو اسحب ملف فيديو لرفعه' : 'Click or drag a video file to upload'"
      @click="triggerUpload"
      @keydown="handleKeydown"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      :class="[
        'w-full border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer select-none bg-slate-50/50 hover:bg-emerald-50/20 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        isDragging ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200'
      ]"
    >
      <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
        <Film class="w-6 h-6" />
      </div>
      <div class="flex flex-col items-center text-center">
        <span class="text-xs font-bold text-slate-800">
          {{ isAr ? 'اسحب ملف الفيديو وأفلته هنا' : 'Drag & drop video file here' }}
        </span>
        <span class="text-[11px] text-slate-400 mt-0.5 font-medium">
          {{ isAr ? 'أو انقر لاختيار ملف من جهازك' : 'or click to browse from device' }}
        </span>
        <span class="text-[10px] text-slate-400 mt-2 px-2.5 py-0.5 rounded-md bg-slate-100/80 font-mono">
          {{ defaultHint }}
        </span>
      </div>
    </div>

    <!-- Video Preview & Player Mode -->
    <div v-else class="flex flex-col gap-2.5">
      <div class="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-inner aspect-video flex items-center justify-center">
        <video
          ref="videoPlayerRef"
          :src="resolvedVideoUrl"
          controls
          playsinline
          preload="metadata"
          @loadedmetadata="onVideoMetadataLoaded"
          class="w-full h-full object-contain"
        ></video>
      </div>

      <!-- Action & Info Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
        <div class="flex items-center gap-2 min-w-0">
          <Film class="w-4 h-4 text-emerald-600 shrink-0" />
          <span class="text-xs font-bold text-slate-800 truncate max-w-[180px] sm:max-w-xs font-mono" :title="modelValue || uploadFileName">
            {{ uploadFileName || modelValue }}
          </span>
          <span
            v-if="durationSeconds > 0"
            class="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold shrink-0"
          >
            {{ formatDuration(durationSeconds) }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <!-- Capture Thumbnail from current frame -->
          <button
            type="button"
            @click="captureThumbnail"
            :disabled="isCapturingThumbnail"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            :title="isAr ? 'التقاط إطار كصورة مصغرة' : 'Capture frame as thumbnail'"
          >
            <CheckCircle2 v-if="thumbnailCapturedSuccess" class="w-3.5 h-3.5 text-emerald-600" />
            <Camera v-else class="w-3.5 h-3.5 text-slate-500" />
            <span>{{ isAr ? 'التقاط غلاف' : 'Capture Frame' }}</span>
          </button>

          <!-- Change Video Button -->
          <button
            type="button"
            @click="triggerUpload"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw class="w-3 h-3 text-slate-500" />
            <span>{{ isAr ? 'تغيير' : 'Change' }}</span>
          </button>

          <!-- Remove Video Button -->
          <button
            type="button"
            @click="removeVideo"
            class="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            :title="isAr ? 'حذف الفيديو' : 'Remove video'"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
