<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  currentPage?: number
  totalPages?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  totalPages: 5
})

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'change', page: number): void
}>()

const setPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page)
    emit('change', page)
  }
}
</script>

<template>
  <div class="flex items-center justify-end gap-1.5 py-4 select-none">
    <button
      type="button"
      :disabled="currentPage <= 1"
      @click="setPage(currentPage - 1)"
      class="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 transition-colors cursor-pointer text-xs"
    >
      <ChevronLeft class="w-3.5 h-3.5 rtl:rotate-180" />
    </button>

    <button
      v-for="page in totalPages"
      :key="page"
      type="button"
      @click="setPage(page)"
      :class="[
        'w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer',
        currentPage === page
          ? 'bg-emerald-600 text-white shadow-xs font-bold'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      ]"
    >
      {{ page }}
    </button>

    <button
      type="button"
      :disabled="currentPage >= totalPages"
      @click="setPage(currentPage + 1)"
      class="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 transition-colors cursor-pointer text-xs"
    >
      <ChevronRight class="w-3.5 h-3.5 rtl:rotate-180" />
    </button>
  </div>
</template>
