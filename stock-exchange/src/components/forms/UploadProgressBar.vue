<script setup lang="ts">
import { computed } from 'vue'
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileIcon,
  Film,
  Image as ImageIcon,
  Loader2,
  Zap,
  Clock,
  Info,
  Sparkles,
  FastForward,
} from 'lucide-vue-next'
import { useLocale } from '@/composables/useLocale'

interface Props {
  progress: number
  fileName: string
  fileSize?: number | string
  uploadedBytes?: number
  bytesPerSecond?: number
  etaSeconds?: number
  status?: 'uploading' | 'processing' | 'success' | 'error' | 'idle' | 'compressing'
  statusCustomText?: string
  errorMessage?: string
  errorHint?: string
  canCancel?: boolean
  canRetry?: boolean
  canSkip?: boolean
  mediaType?: 'video' | 'image' | 'file' | 'audio'
  savingsBadge?: string
}

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  status: 'uploading',
  statusCustomText: '',
  errorMessage: '',
  errorHint: '',
  canCancel: true,
  canRetry: true,
  canSkip: false,
  mediaType: 'file',
  savingsBadge: '',
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'retry'): void
  (e: 'remove'): void
  (e: 'skip'): void
}>()

const { isAr } = useLocale()

const formatBytes = (bytes: number): string => {
  if (isNaN(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const formattedTotalSize = computed(() => {
  if (!props.fileSize) return ''
  if (typeof props.fileSize === 'string') return props.fileSize
  return formatBytes(props.fileSize)
})

const formattedTransfer = computed(() => {
  if (
    props.uploadedBytes !== undefined &&
    props.uploadedBytes > 0 &&
    typeof props.fileSize === 'number' &&
    props.fileSize > 0
  ) {
    const uploaded = formatBytes(props.uploadedBytes)
    const total = formatBytes(props.fileSize)
    return `${uploaded} / ${total}`
  }
  return formattedTotalSize.value
})

const formattedSpeed = computed(() => {
  if (!props.bytesPerSecond || props.bytesPerSecond <= 0 || props.status !== 'uploading') return ''
  const speed = formatBytes(props.bytesPerSecond)
  return isAr.value ? `${speed}/ث` : `${speed}/s`
})

const formattedEta = computed(() => {
  if (props.etaSeconds === undefined || props.etaSeconds <= 0 || props.status !== 'uploading') return ''
  const secs = props.etaSeconds
  if (secs < 60) {
    return isAr.value ? `${secs} ثانية متبقية` : `${secs}s left`
  }
  const mins = Math.floor(secs / 60)
  const remainingSecs = secs % 60
  if (mins < 60) {
    return isAr.value
      ? `${mins} د و ${remainingSecs} ث متبقية`
      : `${mins}m ${remainingSecs}s left`
  }
  const hours = Math.floor(mins / 60)
  return isAr.value ? `${hours} ساعة متبقية` : `${hours}h left`
})

const clampedProgress = computed(() => {
  if (props.status === 'success') return 100
  if (props.status === 'processing') return 100
  return Math.min(99, Math.max(0, Math.round(props.progress)))
})

const statusText = computed(() => {
  if (props.statusCustomText) {
    return props.statusCustomText
  }
  if (props.status === 'compressing') {
    return isAr.value
      ? `جاري ضغط الفيديو... ${clampedProgress.value}%`
      : `Compressing video... ${clampedProgress.value}%`
  }
  if (props.status === 'success') {
    return isAr.value ? 'اكتمل الرفع بنجاح' : 'Upload completed successfully'
  }
  if (props.status === 'error') {
    return props.errorMessage || (isAr.value ? 'فشل الرفع، يرجى المحاولة ثانية' : 'Upload failed, please retry')
  }
  if (props.status === 'processing') {
    return isAr.value ? 'جاري المعالجة والتحقق على الخادم...' : 'Processing & verifying on server...'
  }
  return isAr.value
    ? `جاري الرفع... ${clampedProgress.value}%`
    : `Uploading... ${clampedProgress.value}%`
})

const ariaValueText = computed(() => {
  return `${props.fileName}: ${statusText.value} (${clampedProgress.value}%)`
})

const mediaIcon = computed(() => {
  if (props.mediaType === 'video') return Film
  if (props.mediaType === 'image') return ImageIcon
  return FileIcon
})
</script>

<template>
  <div
    class="w-full bg-white rounded-xl border p-4 shadow-xs transition-all duration-300"
    :class="{
      'border-violet-300/80 bg-violet-50/25': status === 'compressing',
      'border-emerald-300/80 bg-emerald-50/25': status === 'success',
      'border-rose-300/80 bg-rose-50/30': status === 'error',
      'border-indigo-300/80 bg-indigo-50/20': status === 'processing',
      'border-slate-200/90 hover:border-slate-300': status === 'uploading' || status === 'idle'
    }"
  >
    <!-- Screen Reader Live Status -->
    <div
      class="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ ariaValueText }}
    </div>

    <!-- Header info: File Icon, Name, Size & Actions -->
    <div class="flex items-start justify-between gap-3 mb-2.5">
      <div class="flex items-center gap-3 min-w-0">
        <!-- Status / Media Icon Badge -->
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs"
          :class="{
            'bg-violet-100 text-violet-700 ring-2 ring-violet-200/60 animate-pulse': status === 'compressing',
            'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200/50': status === 'success',
            'bg-rose-100 text-rose-700 ring-2 ring-rose-200/50': status === 'error',
            'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200/50 animate-pulse': status === 'processing',
            'bg-slate-100 text-slate-700': status === 'uploading' || status === 'idle'
          }"
        >
          <Sparkles v-if="status === 'compressing'" class="w-5 h-5 text-violet-600" />
          <CheckCircle2 v-else-if="status === 'success'" class="w-5 h-5 text-emerald-600" />
          <AlertCircle v-else-if="status === 'error'" class="w-5 h-5 text-rose-600" />
          <Loader2 v-else-if="status === 'processing'" class="w-5 h-5 text-indigo-600 animate-spin" />
          <component :is="mediaIcon" v-else class="w-5 h-5 text-slate-600" />
        </div>

        <div class="flex flex-col min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-800 truncate" :title="fileName">
              {{ fileName }}
            </span>
            <!-- Savings Badge -->
            <span
              v-if="savingsBadge"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold font-mono shrink-0 border border-emerald-200"
            >
              <Zap class="w-3 h-3 text-emerald-600" />
              {{ savingsBadge }}
            </span>
          </div>

          <div class="flex items-center flex-wrap gap-2 text-[11px] text-slate-500 mt-0.5">
            <span v-if="formattedTransfer" class="font-medium text-slate-600 tabular-nums">
              {{ formattedTransfer }}
            </span>
            <span v-if="formattedTransfer" class="text-slate-300">•</span>
            <span
              :class="{
                'text-violet-700 font-semibold flex items-center gap-1': status === 'compressing',
                'text-emerald-700 font-semibold': status === 'success',
                'text-rose-600 font-semibold': status === 'error',
                'text-indigo-600 font-semibold flex items-center gap-1': status === 'processing',
                'text-slate-600': status === 'uploading'
              }"
            >
              <Loader2 v-if="status === 'processing' || status === 'compressing'" class="w-3 h-3 animate-spin inline" />
              {{ statusText }}
            </span>
          </div>
        </div>
      </div>

      <!-- Action Buttons & Live Stats -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Live Speed & ETA Pill (while uploading) -->
        <div
          v-if="status === 'uploading' && (formattedSpeed || formattedEta)"
          class="hidden sm:flex items-center gap-2 text-[11px] bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1 text-slate-600"
        >
          <span v-if="formattedSpeed" class="flex items-center gap-1 font-medium text-emerald-700 tabular-nums">
            <Zap class="w-3 h-3 text-emerald-500" />
            {{ formattedSpeed }}
          </span>
          <span v-if="formattedSpeed && formattedEta" class="text-slate-300">|</span>
          <span v-if="formattedEta" class="flex items-center gap-1 text-slate-500 tabular-nums">
            <Clock class="w-3 h-3 text-slate-400" />
            {{ formattedEta }}
          </span>
        </div>

        <!-- Clamped Percentage Badge -->
        <span
          v-if="status === 'uploading' || status === 'processing' || status === 'compressing'"
          class="text-xs font-bold tabular-nums px-2.5 py-1 rounded-lg border shadow-2xs transition-colors"
          :class="{
            'bg-violet-50 text-violet-700 border-violet-200/80': status === 'compressing',
            'bg-indigo-50 text-indigo-700 border-indigo-200/80': status === 'processing',
            'bg-emerald-50 text-emerald-700 border-emerald-200/80': status === 'uploading'
          }"
        >
          {{ clampedProgress }}%
        </span>

        <!-- Skip Compression Button -->
        <button
          v-if="status === 'compressing' && canSkip"
          type="button"
          @click="emit('skip')"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-100 hover:bg-violet-200 text-violet-800 border border-violet-200/80 shadow-2xs transition-colors cursor-pointer"
          :title="isAr ? 'تخطي مرحلة الضغط والبدء في رفع الملف الأصلي فوراً' : 'Skip compression and upload original file directly'"
        >
          <FastForward class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">{{ isAr ? 'تخطي الضغط' : 'Skip Compression' }}</span>
        </button>

        <!-- Retry Button (Text + Icon on Error) -->
        <button
          v-if="status === 'error' && canRetry"
          type="button"
          @click="emit('retry')"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
          :aria-label="isAr ? `إعادة محاولة رفع ${fileName}` : `Retry uploading ${fileName}`"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>{{ isAr ? 'إعادة المحاولة' : 'Retry' }}</span>
        </button>

        <!-- Cancel / Remove Button -->
        <button
          v-if="((status === 'uploading' || status === 'compressing') && canCancel) || status === 'success' || status === 'error'"
          type="button"
          @click="(status === 'uploading' || status === 'compressing') ? emit('cancel') : emit('remove')"
          class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none cursor-pointer"
          :title="(status === 'uploading' || status === 'compressing') ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? 'حذف' : 'Remove')"
          :aria-label="
            (status === 'uploading' || status === 'compressing')
              ? (isAr ? `إلغاء العملية ${fileName}` : `Cancel process ${fileName}`)
              : (isAr ? `حذف ${fileName}` : `Remove ${fileName}`)
          "
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Accessible Progress Bar Track & Fill -->
    <div
      role="progressbar"
      :aria-valuenow="clampedProgress"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuetext="ariaValueText"
      class="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden relative shadow-inner"
    >
      <div
        class="h-full rounded-full transition-all duration-300 ease-out relative"
        :class="{
          'bg-emerald-500': status === 'success',
          'bg-rose-500': status === 'error',
          'bg-linear-to-r from-violet-600 via-indigo-600 to-purple-600': status === 'compressing',
          'bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600': status === 'processing',
          'bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600': status === 'uploading'
        }"
        :style="{ width: `${clampedProgress}%` }"
      >
        <!-- Animated Shimmer Stripe for Active Upload, Compression, or Processing -->
        <div
          v-if="status === 'uploading' || status === 'processing' || status === 'compressing'"
          class="absolute inset-0 bg-white/35 animate-pulse"
        />
      </div>
    </div>

    <!-- Error Diagnostic Hint Callout (e.g. for 405 Method Not Allowed / IIS Size Limits) -->
    <div
      v-if="status === 'error' && errorHint"
      class="mt-2.5 p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/80 flex items-start gap-2 text-xs text-rose-800"
    >
      <Info class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
      <span class="leading-relaxed">
        {{ errorHint }}
      </span>
    </div>
  </div>
</template>
