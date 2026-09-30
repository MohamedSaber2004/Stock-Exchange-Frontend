<script setup lang="ts">
import { Search } from 'lucide-vue-next'

interface FilterOption {
  label: string
  value: string
}

interface FilterSelect {
  id: string
  label: string
  options: FilterOption[]
  value: string
}

interface Props {
  searchPlaceholder?: string
  searchValue?: string
  filters?: FilterSelect[]
}

withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Search...',
  searchValue: '',
  filters: () => []
})

const emit = defineEmits<{
  (e: 'update:searchValue', val: string): void
  (e: 'update:filter', filterId: string, val: string): void
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 select-none">
    <!-- Search Bar -->
    <div class="relative w-full sm:max-w-sm">
      <Search class="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        :value="searchValue"
        @input="emit('update:searchValue', ($event.target as HTMLInputElement).value)"
        :placeholder="searchPlaceholder"
        class="w-full bg-white border border-slate-200/80 rounded-xl ps-9 pe-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
      />
    </div>

    <!-- Dropdown Filters -->
    <div v-if="filters.length > 0" class="flex items-center gap-2 flex-wrap w-full sm:w-auto">
      <div v-for="filter in filters" :key="filter.id" class="relative flex-1 min-w-[120px] sm:flex-initial">
        <select
          :value="filter.value"
          @change="emit('update:filter', filter.id, ($event.target as HTMLSelectElement).value)"
          class="w-full bg-white border border-slate-200/80 rounded-xl ps-3 pe-8 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs cursor-pointer appearance-none"
        >
          <option value="">{{ filter.label }}</option>
          <option v-for="opt in filter.options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <div class="absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
          ▼
        </div>
      </div>
    </div>
  </div>
</template>
