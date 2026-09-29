<script setup lang="ts">
import { AlertCircle, Inbox, RefreshCw } from 'lucide-vue-next'
import AppButton from './AppButton.vue'

interface Props {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptyMessage?: string
  retryText?: string
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  empty: false,
  emptyTitle: 'لا توجد بيانات',
  emptyMessage: 'لا توجد سجلات لعرضها في الوقت الحالي.',
  retryText: 'إعادة المحاولة',
})

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div class="w-full">
    <!-- Loading State -->
    <div v-if="loading" class="w-full py-12 flex flex-col items-center justify-center">
      <slot name="loading">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span class="text-xs text-slate-500 font-medium">جاري تحميل البيانات...</span>
        </div>
      </slot>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="w-full p-6 rounded-2xl border border-rose-200 bg-rose-50/70 flex flex-col items-center text-center gap-3 my-4 shadow-xs"
    >
      <div class="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
        <AlertCircle class="w-5 h-5" />
      </div>
      <div class="flex flex-col gap-1">
        <h4 class="text-sm font-semibold text-rose-900">تعذر تحميل البيانات</h4>
        <p class="text-xs text-rose-700 max-w-md">{{ error }}</p>
      </div>
      <AppButton variant="danger" size="sm" class="mt-2" @click="emit('retry')">
        <template #prefix>
          <RefreshCw class="w-3.5 h-3.5" />
        </template>
        {{ retryText }}
      </AppButton>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="empty"
      class="w-full py-14 px-4 rounded-2xl border border-dashed border-slate-300 bg-white flex flex-col items-center text-center gap-3 my-4 shadow-xs"
    >
      <slot name="empty">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          <Inbox class="w-6 h-6" />
        </div>
        <div class="flex flex-col gap-1">
          <h4 class="text-sm font-semibold text-slate-800">{{ emptyTitle }}</h4>
          <p class="text-xs text-slate-500 max-w-sm">{{ emptyMessage }}</p>
        </div>
        <slot name="empty-action" />
      </slot>
    </div>

    <!-- Ready State -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>
