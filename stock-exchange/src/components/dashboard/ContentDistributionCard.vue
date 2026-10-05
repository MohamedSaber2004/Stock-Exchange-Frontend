<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileText, Video, Newspaper, Briefcase } from 'lucide-vue-next'
import type { OverviewContentDistributionDto } from '@/domain/models/overview.model'

interface Props {
  distribution?: OverviewContentDistributionDto
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { t } = useI18n()

const dist = computed(() => props.distribution || {
  articlesCount: 0,
  videosCount: 0,
  newsCount: 0,
  servicesCount: 0,
  totalContentItems: 0,
  articlesPercentage: 0,
  videosPercentage: 0,
  newsPercentage: 0,
  servicesPercentage: 0
})
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
        {{ t('dashboard.contentDistribution') }}
      </h3>
      <span class="text-xs font-semibold text-slate-400">
        {{ dist.totalContentItems }} {{ t('dashboard.allContentItems') }}
      </span>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="h-3 w-full bg-slate-100 animate-pulse rounded-full"></div>
      <div class="grid grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="h-12 bg-slate-50 animate-pulse rounded-xl"></div>
      </div>
    </div>

    <!-- Content Bar & Legend -->
    <div v-else class="space-y-4">
      <!-- Multi-segmented Progress Bar -->
      <div class="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
        <div
          :style="{ width: `${dist.articlesPercentage}%` }"
          class="bg-emerald-500 h-full transition-all duration-500 relative group"
          :title="`${t('dashboard.articles')}: ${dist.articlesCount} (${dist.articlesPercentage}%)`"
        ></div>
        <div
          :style="{ width: `${dist.videosPercentage}%` }"
          class="bg-indigo-500 h-full transition-all duration-500 relative group"
          :title="`${t('dashboard.videos')}: ${dist.videosCount} (${dist.videosPercentage}%)`"
        ></div>
        <div
          :style="{ width: `${dist.newsPercentage}%` }"
          class="bg-blue-500 h-full transition-all duration-500 relative group"
          :title="`${t('dashboard.marketNews')}: ${dist.newsCount} (${dist.newsPercentage}%)`"
        ></div>
        <div
          :style="{ width: `${dist.servicesPercentage}%` }"
          class="bg-amber-500 h-full transition-all duration-500 relative group"
          :title="`${t('dashboard.services')}: ${dist.servicesCount} (${dist.servicesPercentage}%)`"
        ></div>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-2 gap-2.5">
        <!-- Articles -->
        <RouterLink
          to="/articles"
          class="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-200/60 transition-all flex items-center justify-between group"
        >
          <div class="flex items-center gap-2">
            <FileText class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div class="text-start">
              <div class="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                {{ t('dashboard.articles') }}
              </div>
              <div class="text-[10px] text-slate-400 font-medium">
                {{ dist.articlesPercentage }}%
              </div>
            </div>
          </div>
          <span class="text-xs font-black text-slate-800">{{ dist.articlesCount }}</span>
        </RouterLink>

        <!-- Videos -->
        <RouterLink
          to="/videos"
          class="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-200/60 transition-all flex items-center justify-between group"
        >
          <div class="flex items-center gap-2">
            <Video class="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <div class="text-start">
              <div class="text-[11px] font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">
                {{ t('dashboard.videos') }}
              </div>
              <div class="text-[10px] text-slate-400 font-medium">
                {{ dist.videosPercentage }}%
              </div>
            </div>
          </div>
          <span class="text-xs font-black text-slate-800">{{ dist.videosCount }}</span>
        </RouterLink>

        <!-- News -->
        <RouterLink
          to="/news"
          class="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-200/60 transition-all flex items-center justify-between group"
        >
          <div class="flex items-center gap-2">
            <Newspaper class="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <div class="text-start">
              <div class="text-[11px] font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                {{ t('dashboard.marketNews') }}
              </div>
              <div class="text-[10px] text-slate-400 font-medium">
                {{ dist.newsPercentage }}%
              </div>
            </div>
          </div>
          <span class="text-xs font-black text-slate-800">{{ dist.newsCount }}</span>
        </RouterLink>

        <!-- Services -->
        <RouterLink
          to="/services"
          class="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-amber-50/40 hover:border-amber-200/60 transition-all flex items-center justify-between group"
        >
          <div class="flex items-center gap-2">
            <Briefcase class="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <div class="text-start">
              <div class="text-[11px] font-bold text-slate-700 group-hover:text-amber-700 transition-colors">
                {{ t('dashboard.services') }}
              </div>
              <div class="text-[10px] text-slate-400 font-medium">
                {{ dist.servicesPercentage }}%
              </div>
            </div>
          </div>
          <span class="text-xs font-black text-slate-800">{{ dist.servicesCount }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
