<script setup lang="ts">
import { computed } from 'vue'
import { X, RefreshCw, CheckCircle2, AlertCircle, FileIcon } from 'lucide-vue-next'
import { useLocale } from '@/composables/useLocale'

interface Props {
  progress: number // 0 - 100
  fileName: string
  fileSize?: number | string // in bytes or formatted string
  status?: 'uploading' | 'processing' | 'success' | 'error' | 'idle'
  errorMessage?: string
  canCancel?: boolean
  canRetry?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  status: 'uploading',
  canCancel: true,
  canRetry: true
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'retry'): void
  (e: 'remove'): void
}>()

const { isAr } = useLocale()

// Format file size
const formattedSize = computed(() => {
  if (!props.fileSize) return ''
  if (typeof props.fileSize === 'string') return props.fileSize
  const bytes = props.fileSize
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})

const clampedProgress = computed(() => {
  return Math.min(100, Math.max(0, Math.round(props.progress)))
})

const statusText = computed(() => {
  if (props.status === 'success') {
    return isAr.value ? 'اكتمل الرفع بنجاح' : 'Upload completed successfully'
  }
  if (props.status === 'error') {
    return props.errorMessage || (isAr.value ? 'فشل الرفع، يرجى المحاولة ثانية' : 'Upload failed, please retry')
  }
  if (props.status === 'processing') {
    return isAr.value ? 'جاري المعالجة والتحقق...' : 'Processing & validating...'
  }
  return isAr.value
    ? `جاري الرفع... ${clampedProgress.value}%`
    : `Uploading... ${clampedProgress.value}%`
})

const ariaValueText = computed(() => {
  return `${props.fileName}: ${statusText.value}`
})
</script>

<template>
  <div
    class="w-full bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs transition-all"
    :class="{
      'border-emerald-300 bg-emerald-50/20': status === 'success',
      'border-rose-300 bg-rose-50/20': status === 'error',
      'border-slate-200': status === 'uploading' || status === 'processing'
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

    <!-- Header info: File Name, Size & Actions -->
    <div class="flex items-center justify-between gap-3 mb-2">
      <div class="flex items-center gap-2.5 min-w-0">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
          :class="{
            'bg-emerald-100 text-emerald-700': status === 'success',
            'bg-rose-100 text-rose-700': status === 'error',
            'bg-slate-100 text-slate-700': status === 'uploading' || status === 'processing'
          }"
        >
          <CheckCircle2 v-if="status === 'success'" class="w-4 h-4" />
          <AlertCircle v-else-if="status === 'error'" class="w-4 h-4" />
          <FileIcon v-else class="w-4 h-4" />
        </div>

        <div class="flex flex-col min-w-0">
          <span class="text-xs font-bold text-slate-800 truncate" :title="fileName">
            {{ fileName }}
          </span>
          <div class="flex items-center gap-2 text-[11px] text-slate-500">
            <span v-if="formattedSize">{{ formattedSize }}</span>
            <span v-if="formattedSize" class="text-slate-300">•</span>
            <span
              :class="{
                'text-emerald-700 font-semibold': status === 'success',
                'text-rose-600 font-semibold': status === 'error',
                'text-slate-500': status === 'uploading' || status === 'processing'
              }"
            >
              {{ statusText }}
            </span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-1.5 shrink-0">
        <span
          v-if="status === 'uploading' || status === 'processing'"
          class="text-xs font-bold text-emerald-700 tabular-nums px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100/80"
        >
          {{ clampedProgress }}%
        </span>

        <!-- Retry Button -->
        <button
          v-if="status === 'error' && canRetry"
          type="button"
          @click="emit('retry')"
          class="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer"
          :aria-label="isAr ? `إعادة محاولة رفع ${fileName}` : `Retry uploading ${fileName}`"
        >
          <RefreshCw class="w-4 h-4" />
        </button>

        <!-- Cancel / Remove Button -->
        <button
          v-if="(status === 'uploading' && canCancel) || status === 'success' || status === 'error'"
          type="button"
          @click="status === 'uploading' ? emit('cancel') : emit('remove')"
          class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none cursor-pointer"
          :aria-label="
            status === 'uploading'
              ? (isAr ? `إلغاء رفع ${fileName}` : `Cancel uploading ${fileName}`)
              : (isAr ? `حذف ${fileName}` : `Remove ${fileName}`)
          "
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Accessible Progress Bar -->
    <div
      role="progressbar"
      :aria-valuenow="clampedProgress"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuetext="ariaValueText"
      class="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative"
    >
      <div
        class="h-full rounded-full transition-all duration-200 ease-out relative"
        :class="{
          'bg-emerald-500': status === 'success',
          'bg-rose-500': status === 'error',
          'bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600': status === 'uploading' || status === 'processing'
        }"
        :style="{ width: `${clampedProgress}%` }"
      >
        <!-- Animated Shimmer for Active Upload -->
        <div
          v-if="status === 'uploading' || status === 'processing'"
          class="absolute inset-0 bg-white/30 animate-pulse"
        />
      </div>
    </div>
  </div>
</template>
