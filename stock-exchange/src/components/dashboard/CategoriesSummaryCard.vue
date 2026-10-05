<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Folder, Layers } from 'lucide-vue-next'
import type { OverviewCategorySummaryDto } from '@/domain/models/overview.model'

interface Props {
  articleCategories?: OverviewCategorySummaryDto[]
  videoCategories?: OverviewCategorySummaryDto[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  articleCategories: () => [],
  videoCategories: () => [],
  loading: false
})

const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const getCategoryName = (c: OverviewCategorySummaryDto) => {
  return isAr.value ? (c.nameAr || c.name) : (c.nameEn || c.name)
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
    <div class="flex items-center gap-2 mb-4">
      <div class="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
        <Layers class="w-3.5 h-3.5" />
      </div>
      <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
        {{ t('dashboard.topCategories') }}
      </h3>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-9 bg-slate-50 animate-pulse rounded-xl"></div>
    </div>

    <div v-else class="space-y-4">
      <!-- Top Article Categories -->
      <div>
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>{{ t('dashboard.articleCategories') }}</span>
          <RouterLink :to="{ path: '/categories', query: { tab: 'articles' } }" class="text-emerald-600 hover:underline cursor-pointer lowercase text-[10px]">
            {{ t('dashboard.viewAll') }}
          </RouterLink>
        </div>

        <div v-if="articleCategories.length === 0" class="text-xs text-slate-400 py-1 font-medium">
          {{ t('dashboard.noCategories') }}
        </div>
        <div v-else class="space-y-1.5">
          <div
            v-for="cat in articleCategories"
            :key="cat.id"
            class="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all text-xs"
          >
            <div class="flex items-center gap-2 truncate">
              <Folder class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span class="font-bold text-slate-700 truncate">{{ getCategoryName(cat) }}</span>
            </div>
            <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] shrink-0">
              {{ cat.count }} {{ t('dashboard.articles') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Top Video Categories -->
      <div class="pt-2 border-t border-slate-100">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>{{ t('dashboard.videoCategories') }}</span>
          <RouterLink :to="{ path: '/categories', query: { tab: 'videos' } }" class="text-indigo-600 hover:underline cursor-pointer lowercase text-[10px]">
            {{ t('dashboard.viewAll') }}
          </RouterLink>
        </div>

        <div v-if="videoCategories.length === 0" class="text-xs text-slate-400 py-1 font-medium">
          {{ t('dashboard.noCategories') }}
        </div>
        <div v-else class="space-y-1.5">
          <div
            v-for="cat in videoCategories"
            :key="cat.id"
            class="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all text-xs"
          >
            <div class="flex items-center gap-2 truncate">
              <Folder class="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span class="font-bold text-slate-700 truncate">{{ getCategoryName(cat) }}</span>
            </div>
            <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] shrink-0">
              {{ cat.count }} {{ t('dashboard.videos') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
