<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Download
} from 'lucide-vue-next'
import { useLocale } from '@/composables/useLocale'
import UploadProgressBar from './UploadProgressBar.vue'

export interface AttachmentItem {
  id: string
  name: string
  size: number // bytes
  url?: string
  progress?: number // 0-100
  status?: 'uploading' | 'processing' | 'success' | 'error'
  errorMessage?: string
}

interface Props {
  modelValue?: AttachmentItem[]
  label?: string
  hint?: string
  multiple?: boolean
  maxSizeBytes?: number // default 15MB
  accept?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  label: '',
  hint: '',
  multiple: true,
  maxSizeBytes: 15 * 1024 * 1024, // 15 MB
  accept: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.rar,.png,.jpg,.jpeg'
})

const emit = defineEmits<{
  (e: 'update:modelValue', items: AttachmentItem[]): void
  (e: 'file-added', file: File): void
  (e: 'file-removed', item: AttachmentItem): void
}>()

const { isAr } = useLocale()
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadAnnounce = ref('')

const defaultLabel = computed(() => {
  return props.label || (isAr.value ? 'المرفقات والملفات' : 'Attachments & Files')
})

const defaultHint = computed(() => {
  return props.hint || (isAr.value ? 'ملفات مدعومة: PDF, Word, Excel, ZIP (بحد أقصى 15MB للملف)' : 'Supported: PDF, Word, Excel, ZIP (max 15MB each)')
})

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (['pdf'].includes(ext)) return { icon: FileText, color: 'text-rose-600 bg-rose-50 border-rose-100' }
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
  if (['zip', 'rar', '7z', 'tar'].includes(ext)) return { icon: FileArchive, color: 'text-amber-600 bg-amber-50 border-amber-100' }
  if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) return { icon: ImageIcon, color: 'text-sky-600 bg-sky-50 border-sky-100' }
  return { icon: File, color: 'text-slate-600 bg-slate-100 border-slate-200' }
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const activeUploadIntervals = new Map<string, ReturnType<typeof setInterval>>()

const uploadFileSimulate = (file: File) => {
  const fileId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  
  if (file.size > props.maxSizeBytes) {
    const errorItem: AttachmentItem = {
      id: fileId,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'error',
      errorMessage: isAr.value
        ? `حجم الملف يتجاوز ${(props.maxSizeBytes / (1024 * 1024)).toFixed(0)} ميجابايت`
        : `File exceeds ${(props.maxSizeBytes / (1024 * 1024)).toFixed(0)} MB limit`
    }
    const currentList = props.multiple ? [...props.modelValue, errorItem] : [errorItem]
    emit('update:modelValue', currentList)
    uploadAnnounce.value = errorItem.errorMessage || 'Upload error'
    return
  }

  const newItem: AttachmentItem = {
    id: fileId,
    name: file.name,
    size: file.size,
    progress: 10,
    status: 'uploading'
  }

  const currentList = props.multiple ? [...props.modelValue, newItem] : [newItem]
  emit('update:modelValue', currentList)
  uploadAnnounce.value = isAr.value ? `بدأ رفع المرفق: ${file.name}` : `Upload started: ${file.name}`

  // Simulate progress
  const interval = setInterval(() => {
    const items = [...props.modelValue]
    const idx = items.findIndex((i) => i.id === fileId)
    if (idx === -1) {
      clearInterval(interval)
      activeUploadIntervals.delete(fileId)
      return
    }

    const currentItem = items[idx]
    if (!currentItem) {
      clearInterval(interval)
      activeUploadIntervals.delete(fileId)
      return
    }

    const currentProg = currentItem.progress || 0
    if (currentProg < 85) {
      items[idx] = {
        ...currentItem,
        progress: currentProg + Math.floor(Math.random() * 18) + 12
      }
      emit('update:modelValue', items)
    } else if (currentProg < 95) {
      items[idx] = {
        ...currentItem,
        progress: currentProg + 5,
        status: 'processing'
      }
      emit('update:modelValue', items)
    } else {
      clearInterval(interval)
      activeUploadIntervals.delete(fileId)
      items[idx] = {
        ...currentItem,
        progress: 100,
        status: 'success',
        url: URL.createObjectURL(file)
      }
      emit('update:modelValue', items)
      emit('file-added', file)
      uploadAnnounce.value = isAr.value ? `اكتمل رفع المرفق: ${file.name}` : `Upload finished: ${file.name}`
    }
  }, 120)

  activeUploadIntervals.set(fileId, interval)
}

const cancelUpload = (id: string) => {
  const timer = activeUploadIntervals.get(id)
  if (timer) {
    clearInterval(timer)
    activeUploadIntervals.delete(id)
  }
  const item = props.modelValue.find((i) => i.id === id)
  const remaining = props.modelValue.filter((i) => i.id !== id)
  emit('update:modelValue', remaining)
  if (item) {
    emit('file-removed', item)
    uploadAnnounce.value = isAr.value ? `تم إلغاء رفع: ${item.name}` : `Upload cancelled: ${item.name}`
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files)
    if (props.multiple) {
      files.forEach((file) => uploadFileSimulate(file))
    } else if (files[0]) {
      uploadFileSimulate(files[0])
    }
    target.value = ''
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const files = Array.from(event.dataTransfer.files)
    if (props.multiple) {
      files.forEach((file) => uploadFileSimulate(file))
    } else if (files[0]) {
      uploadFileSimulate(files[0])
    }
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    triggerFileSelect()
  }
}
</script>

<template>
  <div class="flex flex-col gap-2 w-full">
    <!-- Accessible Label & Hint -->
    <div class="flex items-center justify-between">
      <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <Paperclip class="w-3.5 h-3.5 text-emerald-600" />
        {{ defaultLabel }}
      </label>
      <span class="text-[11px] text-slate-400">
        {{ defaultHint }}
      </span>
    </div>

    <!-- Hidden Native File Input -->
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="hidden"
      tabindex="-1"
      aria-hidden="true"
      @change="handleFileSelect"
    />

    <!-- Screen Reader Live Region for Uploads -->
    <div
      class="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ uploadAnnounce }}
    </div>

    <!-- Dropzone Area -->
    <div
      role="button"
      tabindex="0"
      :aria-label="isAr ? `${defaultLabel} - انقر أو اضغط Enter لاختيار ملفات المرفقات أو اسحبها وأفلتها هنا` : `${defaultLabel} - Click or press Enter to choose attachments or drag and drop`"
      @click="triggerFileSelect"
      @keydown="handleKeydown"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      :class="[
        'w-full border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer select-none bg-slate-50/50 hover:bg-emerald-50/20 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500',
        isDragging ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200'
      ]"
    >
      <div class="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
        <UploadCloud class="w-5 h-5" />
      </div>
      <div class="flex flex-col items-center text-center">
        <span class="text-xs font-bold text-slate-800">
          {{ isAr ? 'اسحب المرفقات وأفلتها هنا' : 'Drag & drop attachments here' }}
        </span>
        <span class="text-[11px] text-slate-400 mt-0.5 font-medium">
          {{ isAr ? 'أو انقر لتصفح الملفات من جهازك' : 'or click to browse files from device' }}
        </span>
      </div>
    </div>

    <!-- List of Uploaded Attachments & In-Progress Uploads -->
    <div
      v-if="modelValue.length > 0"
      class="flex flex-col gap-2 mt-1"
      role="list"
      :aria-label="isAr ? 'قائمة المرفقات المرفوعة' : 'List of uploaded attachments'"
    >
      <div
        v-for="item in modelValue"
        :key="item.id"
        role="listitem"
        class="w-full"
      >
        <!-- In Progress Upload: Render accessible UploadProgressBar -->
        <UploadProgressBar
          v-if="item.status === 'uploading' || item.status === 'processing'"
          :progress="item.progress || 0"
          :file-name="item.name"
          :file-size="item.size"
          :status="item.status"
          :can-cancel="true"
          @cancel="cancelUpload(item.id)"
          @remove="cancelUpload(item.id)"
        />

        <!-- Completed or Error Item Card -->
        <div
          v-else
          class="flex items-center justify-between gap-3 p-3 rounded-xl border bg-white shadow-2xs transition-all"
          :class="item.status === 'error' ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200/90'"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <!-- Dynamic File Type Icon -->
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
              :class="getFileIcon(item.name).color"
            >
              <component :is="getFileIcon(item.name).icon" class="w-4 h-4" />
            </div>

            <div class="flex flex-col min-w-0">
              <span class="text-xs font-bold text-slate-800 truncate" :title="item.name">
                {{ item.name }}
              </span>
              <div class="flex items-center gap-2 text-[11px]">
                <span class="text-slate-400">{{ formatBytes(item.size) }}</span>
                <span class="text-slate-300">•</span>
                <span v-if="item.status === 'error'" class="text-rose-600 font-semibold">
                  {{ item.errorMessage || (isAr ? 'فشل الرفع' : 'Upload failed') }}
                </span>
                <span v-else class="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 class="w-3 h-3 inline" />
                  {{ isAr ? 'جاهز' : 'Ready' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 shrink-0">
            <button
              type="button"
              @click="cancelUpload(item.id)"
              class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none cursor-pointer"
              :aria-label="isAr ? `حذف المرفق ${item.name}` : `Delete attachment ${item.name}`"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
