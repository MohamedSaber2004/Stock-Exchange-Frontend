<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TrendingUp, Users, Activity } from 'lucide-vue-next'
import type { OverviewTrendItemDto } from '@/domain/models/overview.model'

interface Props {
  userTrend?: OverviewTrendItemDto[]
  activityTrend?: OverviewTrendItemDto[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userTrend: () => [],
  activityTrend: () => [],
  loading: false
})

const { t } = useI18n()
const activeTab = ref<'users' | 'activities'>('users')

const activeData = computed(() => {
  return activeTab.value === 'users' ? props.userTrend : props.activityTrend
})

const maxCount = computed(() => {
  if (!activeData.value || activeData.value.length === 0) return 10
  const max = Math.max(...activeData.value.map(d => d.count))
  return max > 0 ? max : 5
})

const totalWeekly = computed(() => {
  if (!activeData.value) return 0
  return activeData.value.reduce((acc, curr) => acc + curr.count, 0)
})

const hoveredIndex = ref<number | null>(null)
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp class="w-3.5 h-3.5" />
          </div>
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {{ t('dashboard.userTrends') }}
          </h3>
        </div>
        <p class="text-[11px] text-slate-400 font-medium mt-1">
          {{ t('dashboard.last7Days') }}: <span class="font-bold text-slate-700">{{ totalWeekly }}</span> {{ activeTab === 'users' ? t('dashboard.registrations') : t('dashboard.activities') }}
        </p>
      </div>

      <!-- Tab Toggle -->
      <div class="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
        <button
          type="button"
          :class="[
            'px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
            activeTab === 'users' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          ]"
          @click="activeTab = 'users'"
        >
          <Users class="w-3 h-3" />
          <span>{{ t('dashboard.registrations') }}</span>
        </button>

        <button
          type="button"
          :class="[
            'px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
            activeTab === 'activities' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          ]"
          @click="activeTab = 'activities'"
        >
          <Activity class="w-3 h-3" />
          <span>{{ t('dashboard.activities') }}</span>
        </button>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="h-44 flex items-end justify-between gap-2 pt-6">
      <div v-for="i in 7" :key="i" class="flex-1 flex flex-col items-center gap-2">
        <div
          class="w-full bg-slate-100 animate-pulse rounded-t-lg"
          :style="{ height: `${20 + (i * 12)}%` }"
        ></div>
        <div class="h-3 w-6 bg-slate-100 animate-pulse rounded"></div>
      </div>
    </div>

    <!-- Chart -->
    <div v-else class="h-44 flex flex-col justify-end pt-4">
      <div class="flex items-end justify-between gap-2.5 sm:gap-4 h-32 px-1">
        <div
          v-for="(item, idx) in activeData"
          :key="item.date"
          class="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
          @mouseenter="hoveredIndex = idx"
          @mouseleave="hoveredIndex = null"
        >
          <!-- Tooltip -->
          <div
            v-if="hoveredIndex === idx"
            class="absolute -top-8 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md shadow-md z-10 whitespace-nowrap animate-in fade-in"
          >
            {{ item.date }}: {{ item.count }}
          </div>

          <!-- Bar -->
          <div
            :class="[
              'w-full max-w-[32px] rounded-t-lg transition-all duration-300 relative',
              activeTab === 'users'
                ? (hoveredIndex === idx ? 'bg-emerald-600' : 'bg-emerald-500/80')
                : (hoveredIndex === idx ? 'bg-indigo-600' : 'bg-indigo-500/80')
            ]"
            :style="{
              height: `${Math.max(10, Math.round((item.count / maxCount) * 100))}%`
            }"
          >
            <span
              v-if="item.count > 0"
              class="absolute -top-4 inset-x-0 text-center text-[10px] font-black text-slate-600"
            >
              {{ item.count }}
            </span>
          </div>

          <!-- Day Label -->
          <div class="mt-2 text-[10px] font-semibold text-slate-400 group-hover:text-slate-800 transition-colors">
            {{ item.dayName }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
