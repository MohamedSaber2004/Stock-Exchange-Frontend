<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, Inbox, RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import AppButton from './AppButton.vue'

interface Props {
  loading?: boolean
  loadingText?: string
  error?: string | null
  errorTitle?: string
  empty?: boolean
  emptyTitle?: string
  emptyMessage?: string
  retryText?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()

const { t } = useI18n()

const computedLoadingText = computed(() => props.loadingText || t('common.loadingData'))
const computedErrorTitle = computed(() => props.errorTitle || t('common.loadFailed'))
const computedEmptyTitle = computed(() => props.emptyTitle || t('common.noData'))
const computedEmptyMessage = computed(() => props.emptyMessage || t('common.noDataDesc'))
const computedRetryText = computed(() => props.retryText || t('common.retry'))
</script>

<template>
  <div class="w-full">
    <!-- Loading State -->
    <div v-if="loading" class="w-full py-12 flex flex-col items-center justify-center">
      <slot name="loading">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span class="text-xs text-slate-500 font-medium">{{ computedLoadingText }}</span>
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
        <h4 class="text-sm font-semibold text-rose-900">{{ computedErrorTitle }}</h4>
        <p class="text-xs text-rose-700 max-w-md">{{ error }}</p>
      </div>
      <AppButton variant="danger" size="sm" class="mt-2" @click="emit('retry')">
        <template #prefix>
          <RefreshCw class="w-3.5 h-3.5" />
        </template>
        {{ computedRetryText }}
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
          <h4 class="text-sm font-semibold text-slate-800">{{ computedEmptyTitle }}</h4>
          <p class="text-xs text-slate-500 max-w-sm">{{ computedEmptyMessage }}</p>
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
