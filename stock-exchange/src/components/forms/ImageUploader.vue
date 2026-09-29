<script setup lang="ts">
import { UploadCloud, X, RefreshCw } from 'lucide-vue-next'
import { ref } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  hint?: string
  aspectRatio?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: 'Cover Image',
  hint: 'Recommended size: 1200×675',
  aspectRatio: 'aspect-video'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        emit('update:modelValue', e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        emit('update:modelValue', e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  emit('update:modelValue', '')
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-xs font-bold text-slate-700">
      {{ label }}
    </label>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Upload Box or Preview -->
    <div
      v-if="!modelValue"
      @click="triggerUpload"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      :class="[
        'w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer select-none bg-slate-50/50 hover:bg-emerald-50/20 hover:border-emerald-400',
        isDragging ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200'
      ]"
    >
      <div class="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
        <UploadCloud class="w-5 h-5" />
      </div>
      <div class="flex flex-col items-center text-center">
        <span class="text-xs font-bold text-slate-800">
          Drag & drop image
        </span>
        <span class="text-[11px] text-slate-400 mt-0.5 font-medium">
          or click to upload
        </span>
        <span class="text-[10px] text-slate-400 mt-1">
          {{ hint }}
        </span>
      </div>
    </div>

    <!-- Image Preview Mode -->
    <div v-else class="flex flex-col gap-2">
      <div class="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
        <img
          :src="modelValue"
          alt="Preview"
          class="w-full h-44 object-cover transition-transform group-hover:scale-105 duration-300"
        />
        <div class="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            @click="triggerUpload"
            class="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <RefreshCw class="w-3.5 h-3.5" />
            Change Image
          </button>
          <button
            type="button"
            @click="removeImage"
            class="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
      <button
        type="button"
        @click="triggerUpload"
        class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 self-start cursor-pointer underline"
      >
        Change image
      </button>
    </div>
  </div>
</template>
