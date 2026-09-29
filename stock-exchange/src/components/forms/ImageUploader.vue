<script setup lang="ts">
import { UploadCloud, X, RefreshCw, Image as ImageIcon } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import UploadProgressBar from './UploadProgressBar.vue'

interface Props {
  modelValue?: string
  label?: string
  hint?: string
  aspectRatio?: string
  maxSizeBytes?: number // e.g. 5MB default
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  hint: '',
  aspectRatio: 'aspect-video',
  maxSizeBytes: 5 * 1024 * 1024 // 5 MB
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'file-selected', file: File): void
}>()

const { isAr } = useLocale()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Upload progress states
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadFileName = ref('')
const uploadFileSize = ref(0)
const uploadStatus = ref<'uploading' | 'processing' | 'success' | 'error'>('uploading')
const uploadError = ref('')
let uploadInterval: ReturnType<typeof setInterval> | null = null
let pendingDataUrl = ''

const triggerUpload = () => {
  fileInput.value?.click()
}

const defaultLabel = computed(() => {
  return props.label || (isAr.value ? 'صورة الغلاف' : 'Cover Image')
})

const defaultHint = computed(() => {
  return props.hint || (isAr.value ? 'الحجم الموصى به: 1200×675 (PNG, JPG, WebP بحد أقصى 5MB)' : 'Recommended: 1200×675 (PNG, JPG, WebP up to 5MB)')
})

const cancelUpload = () => {
  if (uploadInterval) {
    clearInterval(uploadInterval)
    uploadInterval = null
  }
  isUploading.value = false
  uploadProgress.value = 0
  uploadFileName.value = ''
  uploadFileSize.value = 0
  pendingDataUrl = ''
  if (fileInput.value) fileInput.value.value = ''
}

const startUploadSimulation = (file: File, dataUrl: string) => {
  isUploading.value = true
  uploadStatus.value = 'uploading'
  uploadProgress.value = 8
  uploadFileName.value = file.name
  uploadFileSize.value = file.size
  uploadError.value = ''
  pendingDataUrl = dataUrl

  if (uploadInterval) clearInterval(uploadInterval)

  uploadInterval = setInterval(() => {
    if (uploadProgress.value < 85) {
      uploadProgress.value += Math.floor(Math.random() * 18) + 10
    } else if (uploadProgress.value < 95) {
      uploadProgress.value += 4
      uploadStatus.value = 'processing'
    } else {
      // Completed
      if (uploadInterval) {
        clearInterval(uploadInterval)
        uploadInterval = null
      }
      uploadProgress.value = 100
      uploadStatus.value = 'success'

      setTimeout(() => {
        emit('update:modelValue', pendingDataUrl)
        emit('file-selected', file)
        isUploading.value = false
        uploadProgress.value = 0
      }, 450)
    }
  }, 90)
}

const processFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    uploadStatus.value = 'error'
    uploadError.value = isAr.value ? 'الملف المحدد ليس صورة صالحة' : 'Selected file is not a valid image'
    isUploading.value = true
    uploadFileName.value = file.name
    uploadFileSize.value = file.size
    return
  }

  if (file.size > props.maxSizeBytes) {
    uploadStatus.value = 'error'
    uploadError.value = isAr.value
      ? `حجم الصورة كبير جداً، الحد الأقصى هو ${(props.maxSizeBytes / (1024 * 1024)).toFixed(0)} ميجابايت`
      : `File too large, max size is ${(props.maxSizeBytes / (1024 * 1024)).toFixed(0)} MB`
    isUploading.value = true
    uploadFileName.value = file.name
    uploadFileSize.value = file.size
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    if (e.target?.result) {
      startUploadSimulation(file, e.target.result as string)
    }
  }
  reader.readAsDataURL(file)
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

const removeImage = () => {
  emit('update:modelValue', '')
  if (fileInput.value) fileInput.value.value = ''
  cancelUpload()
}
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <!-- Accessible Label -->
    <div class="flex items-center justify-between">
      <label v-if="defaultLabel" class="text-xs font-bold text-slate-700">
        {{ defaultLabel }}
      </label>
      <span v-if="hint" class="text-[11px] text-slate-400">
        {{ defaultHint }}
      </span>
    </div>

    <!-- Hidden Native File Input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/jpg,image/svg+xml"
      class="hidden"
      tabindex="-1"
      aria-hidden="true"
      @change="handleFileSelect"
    />

    <!-- Active Upload Progress View -->
    <div v-if="isUploading" class="w-full">
      <UploadProgressBar
        :progress="uploadProgress"
        :file-name="uploadFileName"
        :file-size="uploadFileSize"
        :status="uploadStatus"
        :error-message="uploadError"
        :can-cancel="uploadStatus === 'uploading'"
        :can-retry="uploadStatus === 'error'"
        @cancel="cancelUpload"
        @retry="triggerUpload"
        @remove="cancelUpload"
      />
    </div>

    <!-- Upload Dropzone (When No Image and Not Uploading) -->
    <div
      v-else-if="!modelValue"
      role="button"
      tabindex="0"
      :aria-label="isAr ? `${defaultLabel} - انقر أو اضغط Enter لاختيار صورة، أو اسحب الصورة وأفلتها هنا` : `${defaultLabel} - Click or press Enter to choose image, or drag and drop`"
      @click="triggerUpload"
      @keydown="handleKeydown"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      :class="[
        'w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer select-none bg-slate-50/50 hover:bg-emerald-50/20 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500',
        isDragging ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200'
      ]"
    >
      <div class="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
        <UploadCloud class="w-5 h-5" />
      </div>
      <div class="flex flex-col items-center text-center">
        <span class="text-xs font-bold text-slate-800">
          {{ isAr ? 'اسحب الصورة وأفلتها هنا' : 'Drag & drop image here' }}
        </span>
        <span class="text-[11px] text-slate-400 mt-0.5 font-medium">
          {{ isAr ? 'أو انقر للاختيار من جهازك' : 'or click to browse from device' }}
        </span>
        <span class="text-[10px] text-slate-400 mt-1.5 px-2.5 py-0.5 rounded-md bg-slate-100/80">
          {{ defaultHint }}
        </span>
      </div>
    </div>

    <!-- Image Preview Mode -->
    <div v-else class="flex flex-col gap-2">
      <div class="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
        <img
          :src="modelValue"
          :alt="defaultLabel || 'Uploaded Preview'"
          class="w-full h-44 object-cover transition-transform group-hover:scale-102 duration-300"
        />
        <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            @click="triggerUpload"
            class="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer"
            :aria-label="isAr ? 'تغيير الصورة المرفوعة' : 'Change uploaded image'"
          >
            <RefreshCw class="w-3.5 h-3.5" />
            {{ isAr ? 'تغيير الصورة' : 'Change Image' }}
          </button>
          <button
            type="button"
            @click="removeImage"
            class="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none cursor-pointer"
            :aria-label="isAr ? 'حذف الصورة الحالية' : 'Delete current image'"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <button
          type="button"
          @click="triggerUpload"
          class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-md px-1"
        >
          <RefreshCw class="w-3 h-3" />
          {{ isAr ? 'تغيير الصورة' : 'Change image' }}
        </button>

        <button
          type="button"
          @click="removeImage"
          class="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none rounded-md px-1"
        >
          <X class="w-3 h-3" />
          {{ isAr ? 'حذف الصورة' : 'Remove' }}
        </button>
      </div>
    </div>
  </div>
</template>
