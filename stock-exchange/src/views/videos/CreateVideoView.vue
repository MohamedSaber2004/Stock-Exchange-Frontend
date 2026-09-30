<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, Film, Sparkles, X, Image as ImageIcon, Camera } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import RichTextEditor from '@/components/forms/RichTextEditor.vue'
import UploadProgressBar from '@/components/forms/UploadProgressBar.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { toast } = useFeedback()
const { t, locale } = useI18n()

const isAr = computed(() => locale.value === 'ar')

const form = ref({
  title: '',
  category: '',
  educator: '',
  educatorTitle: '',
  duration: '',
  description: '',
  sourceType: 'Direct MP4',
  thumbnail: '',
  status: 'Published'
})

// Video source, player, auto-duration, auto-thumbnail & upload progress state
const videoSource = ref<string>('')
const videoFile = ref<File | null>(null)
const videoPlayerRef = ref<HTMLVideoElement | null>(null)
const videoInputRef = ref<HTMLInputElement | null>(null)
const isDraggingVideo = ref(false)
const isDurationAuto = ref(false)
const isThumbnailAuto = ref(false)
const isVideoUploading = ref(false)
const videoUploadProgress = ref(0)
const videoUploadStatus = ref<'uploading' | 'processing' | 'success' | 'error'>('uploading')
let videoUploadTimer: ReturnType<typeof setInterval> | null = null

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

// Automatically captures the first frame of the video into form.thumbnail
const captureVideoThumbnail = () => {
  const video = videoPlayerRef.value
  if (!video) return

  const width = video.videoWidth || 640
  const height = video.videoHeight || 360
  if (width === 0 || height === 0) return

  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
      if (dataUrl && dataUrl.length > 200) {
        form.value.thumbnail = dataUrl
        isThumbnailAuto.value = true
      }
    }
  } catch (err) {
    console.warn('Canvas export warning (e.g. cross-origin video):', err)
    if (!form.value.thumbnail) {
      form.value.thumbnail = 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80'
      isThumbnailAuto.value = true
    }
  }
}

// Background processor to extract thumbnail directly upon file upload
const extractThumbnailFromFile = (file: File) => {
  const tempUrl = URL.createObjectURL(file)
  const tempVideo = document.createElement('video')
  tempVideo.preload = 'auto'
  tempVideo.src = tempUrl
  tempVideo.muted = true
  tempVideo.playsInline = true

  const tryCapture = () => {
    try {
      const width = tempVideo.videoWidth || 640
      const height = tempVideo.videoHeight || 360
      if (width === 0 || height === 0) return

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(tempVideo, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
        if (dataUrl && dataUrl.length > 200) {
          form.value.thumbnail = dataUrl
          isThumbnailAuto.value = true
        }
      }
    } catch (e) {
      console.warn('Background thumbnail extraction error:', e)
    } finally {
      URL.revokeObjectURL(tempUrl)
    }
  }

  tempVideo.onloadeddata = () => {
    tempVideo.currentTime = 0.5
  }
  tempVideo.onseeked = () => {
    tryCapture()
  }
  tempVideo.onerror = () => {
    URL.revokeObjectURL(tempUrl)
  }
}

const onVideoMetadataLoaded = () => {
  const video = videoPlayerRef.value
  if (video && !isNaN(video.duration) && video.duration > 0) {
    const formatted = formatDuration(video.duration)
    form.value.duration = formatted
    isDurationAuto.value = true
    toast.success(
      isAr.value
        ? `تم احتساب مدة الفيديو تلقائياً: ${formatted}`
        : `Video duration auto-calculated: ${formatted}`
    )
  }

  // Seek slightly to ensure first painted frame
  if (video) {
    video.currentTime = Math.min(0.5, (video.duration || 1) / 2)
    setTimeout(() => {
      captureVideoThumbnail()
    }, 250)
  }
}

const onVideoLoadedData = () => {
  captureVideoThumbnail()
}

const onVideoCanPlay = () => {
  if (!form.value.thumbnail) {
    captureVideoThumbnail()
  }
}

const onVideoSeeked = () => {
  captureVideoThumbnail()
}

const handleVideoSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    loadVideoFile(target.files[0])
  }
}

const handleVideoDrop = (event: DragEvent) => {
  isDraggingVideo.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    loadVideoFile(event.dataTransfer.files[0])
  }
}

const cancelVideoUpload = () => {
  if (videoUploadTimer) {
    clearInterval(videoUploadTimer)
    videoUploadTimer = null
  }
  isVideoUploading.value = false
  videoUploadProgress.value = 0
  if (videoInputRef.value) videoInputRef.value.value = ''
}

const loadVideoFile = (file: File) => {
  if (!file.type.startsWith('video/')) {
    toast.error(isAr.value ? 'يرجى اختيار ملف فيديو صالح' : 'Please select a valid video file')
    return
  }

  cancelVideoUpload()

  isVideoUploading.value = true
  videoUploadProgress.value = 10
  videoUploadStatus.value = 'uploading'
  videoFile.value = file

  videoUploadTimer = setInterval(() => {
    if (videoUploadProgress.value < 80) {
      videoUploadProgress.value += Math.floor(Math.random() * 15) + 12
    } else if (videoUploadProgress.value < 95) {
      videoUploadProgress.value += 4
      videoUploadStatus.value = 'processing'
    } else {
      if (videoUploadTimer) {
        clearInterval(videoUploadTimer)
        videoUploadTimer = null
      }
      videoUploadProgress.value = 100
      videoUploadStatus.value = 'success'

      setTimeout(() => {
        isVideoUploading.value = false
        videoUploadProgress.value = 0

        if (videoSource.value && videoSource.value.startsWith('blob:')) {
          URL.revokeObjectURL(videoSource.value)
        }
        videoSource.value = URL.createObjectURL(file)
        isDurationAuto.value = false
        isThumbnailAuto.value = false
        form.value.thumbnail = ''

        // Immediately extract thumbnail from the file
        extractThumbnailFromFile(file)
      }, 350)
    }
  }, 100)
}

const setSampleVideo = () => {
  if (videoSource.value && videoSource.value.startsWith('blob:')) {
    URL.revokeObjectURL(videoSource.value)
  }
  videoSource.value = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  videoFile.value = null
  isDurationAuto.value = false
  isThumbnailAuto.value = false
  form.value.thumbnail = ''
}

const removeVideo = () => {
  if (videoSource.value && videoSource.value.startsWith('blob:')) {
    URL.revokeObjectURL(videoSource.value)
  }
  videoSource.value = ''
  videoFile.value = null
  form.value.duration = ''
  form.value.thumbnail = ''
  isDurationAuto.value = false
  isThumbnailAuto.value = false
  if (videoInputRef.value) videoInputRef.value.value = ''
}

onUnmounted(() => {
  if (videoSource.value && videoSource.value.startsWith('blob:')) {
    URL.revokeObjectURL(videoSource.value)
  }
})

const handleSave = () => {
  if (!form.value.title) {
    toast.error(isAr.value ? 'يرجى إدخال عنوان الفيديو' : 'Please enter video title')
    return
  }
  toast.success(t('videos.createVideo'))
  router.push('/videos')
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-5xl mx-auto">
      <PageHeader
        :title="t('videos.createVideo')"
        :description="t('videos.subtitle')"
      />

      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-2xs">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          <!-- Left Main Column: 2 cols -->
          <div class="lg:col-span-2 flex flex-col gap-5">
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {{ t('videos.videoDetails') }}
            </h2>

            <!-- Title -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('videos.videoTitle') }}</label>
              <input
                v-model="form.title"
                type="text"
                :placeholder="t('videos.enterTitle')"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
              />
            </div>

            <!-- Category -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('videos.category') }}</label>
              <select
                v-model="form.category"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer font-medium"
              >
                <option value="">{{ t('videos.selectCategory') }}</option>
                <option value="Beginner">{{ t('videos.catBeginner') }}</option>
                <option value="Market">{{ t('videos.catMarket') }}</option>
                <option value="Technical">{{ t('videos.catTechnical') }}</option>
                <option value="Investing">{{ t('videos.catInvesting') }}</option>
              </select>
            </div>

            <!-- Educator & Title -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">{{ t('videos.educator') }}</label>
                <input
                  v-model="form.educator"
                  type="text"
                  :placeholder="t('videos.enterEducator')"
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700">{{ t('videos.educatorTitle') }}</label>
                <input
                  v-model="form.educatorTitle"
                  type="text"
                  :placeholder="t('videos.enterEducatorTitle')"
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
                />
              </div>
            </div>

            <!-- Duration (Auto-calculated from displayed video) -->
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700">{{ t('videos.duration') }} *</label>
                <span
                  v-if="isDurationAuto"
                  class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse"
                >
                  <Sparkles class="w-3 h-3 text-emerald-600" />
                  {{ t('videos.durationAuto') }}
                </span>
              </div>
              <div class="relative">
                <Clock class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="form.duration"
                  type="text"
                  placeholder="e.g. 15:30"
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl ps-10 pe-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
                />
              </div>
              <p v-if="!videoSource" class="text-[11px] text-slate-400">
                {{ t('videos.durationHint') }}
              </p>
            </div>

            <!-- Description -->
            <RichTextEditor
              v-model="form.description"
              :label="t('videos.description')"
              :placeholder="t('videos.writeDescription')"
              :rows="6"
            />
          </div>

          <!-- Right Column: 1 col -->
          <div class="flex flex-col gap-6">
            <!-- Displayed Video Player & Uploader -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700">{{ t('videos.videoFile') }} *</label>
                <button
                  v-if="!videoSource"
                  type="button"
                  @click="setSampleVideo"
                  class="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
                >
                  {{ t('videos.useSampleVideo') }}
                </button>
              </div>

              <!-- Hidden File Input -->
              <input
                ref="videoInputRef"
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                class="hidden"
                @change="handleVideoSelect"
              />

              <!-- When Video Upload is In Progress: Accessible Progress Bar -->
              <div v-if="isVideoUploading" class="w-full">
                <UploadProgressBar
                  :progress="videoUploadProgress"
                  :file-name="videoFile?.name || (isAr ? 'ملف الفيديو' : 'Video file')"
                  :file-size="videoFile?.size || 0"
                  :status="videoUploadStatus"
                  :can-cancel="true"
                  @cancel="cancelVideoUpload"
                  @remove="cancelVideoUpload"
                />
              </div>

              <!-- When Video is Displayed -->
              <div
                v-else-if="videoSource"
                class="flex flex-col gap-2.5 p-3 bg-slate-50/90 border border-slate-200 rounded-2xl"
              >
                <!-- Displayed HTML5 Video element -->
                <div class="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner">
                  <video
                    ref="videoPlayerRef"
                    :src="videoSource"
                    controls
                    crossorigin="anonymous"
                    playsinline
                    @loadedmetadata="onVideoMetadataLoaded"
                    @loadeddata="onVideoLoadedData"
                    @canplay="onVideoCanPlay"
                    @seeked="onVideoSeeked"
                    class="w-full h-full object-contain"
                  ></video>
                </div>

                <div class="flex items-center justify-between pt-1">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                      {{ videoFile ? videoFile.name : (isAr ? 'فيديو تجريبي' : 'Sample Video') }}
                    </span>
                    <span v-if="form.duration" class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                      {{ form.duration }}
                    </span>
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      @click="videoInputRef?.click()"
                      class="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                    >
                      {{ t('videos.changeVideo') }}
                    </button>
                    <button
                      type="button"
                      @click="removeVideo"
                      class="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                      :title="t('videos.removeVideo')"
                      :aria-label="t('videos.removeVideo')"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- When No Video: Upload Dropzone with Keyboard Accessibility -->
              <div
                v-else
                role="button"
                tabindex="0"
                :aria-label="isAr ? 'رفع ملف فيديو - انقر أو اضغط Enter لاختيار ملف أو اسحب وأفلت هنا' : 'Upload video file - click or press Enter to choose file or drag and drop here'"
                @click="videoInputRef?.click()"
                @keydown.enter.prevent="videoInputRef?.click()"
                @keydown.space.prevent="videoInputRef?.click()"
                @dragover.prevent="isDraggingVideo = true"
                @dragleave.prevent="isDraggingVideo = false"
                @drop.prevent="handleVideoDrop"
                :class="[
                  'w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer select-none bg-slate-50/50 hover:bg-emerald-50/20 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500',
                  isDraggingVideo ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200'
                ]"
              >
                <div class="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Film class="w-5 h-5" />
                </div>
                <div class="flex flex-col items-center text-center">
                  <span class="text-xs font-bold text-slate-800">
                    {{ t('videos.dragDropVideo') }}
                  </span>
                  <span class="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {{ t('videos.supportedFormats') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Auto-Generated First Frame Thumbnail Card -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700">{{ t('videos.autoThumbnail') }}</label>
                <span
                  v-if="form.thumbnail"
                  class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
                >
                  <Sparkles class="w-3 h-3 text-emerald-600" />
                  {{ isAr ? 'تم الالتقاط تلقائياً' : 'Auto-captured' }}
                </span>
              </div>

              <!-- Preview of Auto-captured Thumbnail -->
              <div
                v-if="form.thumbnail"
                class="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video group shadow-xs"
              >
                <img
                  :src="form.thumbnail"
                  alt="Auto-generated Thumbnail"
                  class="w-full h-full object-cover"
                />
                <!-- Subtle overlay with capture button if user wants to re-grab at current video time -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3 opacity-90 group-hover:opacity-100 transition-opacity">
                  <span class="text-[11px] text-white/90 font-medium">
                    {{ t('videos.autoThumbnailDesc') }}
                  </span>
                  <button
                    type="button"
                    @click="captureVideoThumbnail"
                    class="px-2 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                    :title="isAr ? 'إعادة التقاط الإطار' : 'Recapture frame'"
                  >
                    <Camera class="w-3 h-3 text-emerald-600" />
                    <span>{{ isAr ? 'إعادة التقاط' : 'Recapture' }}</span>
                  </button>
                </div>
              </div>

              <!-- Empty state when no thumbnail yet -->
              <div
                v-else
                class="w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-5 flex flex-col items-center justify-center text-center gap-1.5"
              >
                <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ImageIcon class="w-4 h-4" />
                </div>
                <span class="text-xs text-slate-500 font-medium leading-snug max-w-[220px]">
                  {{ t('videos.noThumbnailYet') }}
                </span>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer Actions -->
        <div class="mt-8 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            @click="router.push('/videos')"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer text-center"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="handleSave"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer text-center"
          >
            {{ t('videos.saveVideo') }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>


