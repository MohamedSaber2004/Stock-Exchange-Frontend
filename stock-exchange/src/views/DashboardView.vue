<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppShell from '@/components/layout/AppShell.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import QuickActions from '@/components/dashboard/QuickActions.vue'
import ActivityTable from '@/components/dashboard/ActivityTable.vue'
import ContentDistributionCard from '@/components/dashboard/ContentDistributionCard.vue'
import TrendAnalyticsCard from '@/components/dashboard/TrendAnalyticsCard.vue'
import CategoriesSummaryCard from '@/components/dashboard/CategoriesSummaryCard.vue'
import DataState from '@/components/ui/DataState.vue'
import {
  FileText,
  Video,
  Newspaper,
  Users,
  Globe,
  Briefcase,
  UserCheck,
  RefreshCw,
  Activity
} from 'lucide-vue-next'
import { coreServices } from '@/di'
import type { AdminOverviewDto } from '@/domain/models/overview.model'

const { t } = useI18n()

// State
const overview = ref<AdminOverviewDto | null>(null)
const isLoading = ref(true)
const isRefreshing = ref(false)
const errorMessage = ref<string | null>(null)

// Current Admin User
const currentUser = computed(() => {
  try {
    return coreServices.tokenStore.getUser()
  } catch {
    return null
  }
})

const adminGreeting = computed(() => {
  const name = currentUser.value?.fullName || 'Admin'
  return `${t('dashboard.greeting').replace('Admin', '').trim()} ${name}`.trim()
})

// Fetch Overview Data
const fetchOverview = async (showLoading = true) => {
  if (showLoading) {
    isLoading.value = true
  } else {
    isRefreshing.value = true
  }
  errorMessage.value = null

  try {
    const [overviewRes, activitySummaryRes] = await Promise.allSettled([
      coreServices.overview.getOverview(),
      coreServices.activityLogs.getSummary()
    ])

    if (overviewRes.status === 'fulfilled') {
      const data = overviewRes.value
      // Strictly synchronize totalActivityLogs with Activity Logs service summary
      if (
        activitySummaryRes.status === 'fulfilled' &&
        typeof activitySummaryRes.value.totalLogs === 'number'
      ) {
        data.stats.totalActivityLogs = activitySummaryRes.value.totalLogs
      }
      overview.value = data
    } else {
      throw overviewRes.reason
    }
  } catch (err: unknown) {
    const error = err as { message?: string }
    errorMessage.value = error.message || t('dashboard.loadError')
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

onMounted(() => {
  fetchOverview()
})
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-7xl mx-auto">
      <!-- Greeting Header & Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {{ adminGreeting }}
            </h1>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {{ t('dashboard.systemLive') }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {{ t('dashboard.subtitle') }}
          </p>
        </div>

        <!-- Action / Refresh Button -->
        <button
          type="button"
          :disabled="isLoading || isRefreshing"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer self-start sm:self-auto disabled:opacity-60"
          @click="fetchOverview(false)"
        >
          <RefreshCw
            class="w-3.5 h-3.5 text-slate-500"
            :class="{ 'animate-spin': isRefreshing || isLoading }"
          />
          <span>{{ t('dashboard.refresh') }}</span>
        </button>
      </div>

      <!-- Error State wrapper if initial load completely fails -->
      <DataState
        v-if="errorMessage && !overview"
        :error="errorMessage"
        :error-title="t('dashboard.loadError')"
        :retry-text="t('dashboard.retry')"
        @retry="fetchOverview(true)"
      />

      <div v-else class="flex flex-col gap-6">
        <!-- Stats Grid: Row 1 - User, Membership & Jurisdiction Metrics -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <StatCard
            :title="t('dashboard.totalUsers')"
            :value="overview?.stats.totalUsers ?? 0"
            :loading="isLoading"
            :icon="Users"
            variant="emerald"
            to="/users"
            :subtitle="`${overview?.stats.activeUsers ?? 0} ${t('dashboard.activeUsers').toLowerCase()}`"
          />

          <StatCard
            :title="t('dashboard.newThisMonth')"
            :value="overview?.stats.newUsersThisMonth ?? 0"
            :loading="isLoading"
            :icon="UserCheck"
            variant="blue"
            trend="New"
            trend-type="up"
            to="/users"
          />

          <StatCard
            :title="t('dashboard.countries')"
            :value="overview?.stats.totalCountries ?? 0"
            :loading="isLoading"
            :icon="Globe"
            variant="indigo"
            to="/countries"
          />

          <StatCard
            :title="t('dashboard.activityLogs')"
            :value="overview?.stats.totalActivityLogs ?? 0"
            :loading="isLoading"
            :icon="Activity"
            variant="violet"
            to="/activity"
          />
        </div>

        <!-- Stats Grid: Row 2 - Content & Knowledge Base Metrics -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <StatCard
            :title="t('dashboard.articles')"
            :value="overview?.stats.totalArticles ?? 0"
            :loading="isLoading"
            :icon="FileText"
            variant="emerald"
            to="/articles"
          />

          <StatCard
            :title="t('dashboard.videos')"
            :value="overview?.stats.totalVideos ?? 0"
            :loading="isLoading"
            :icon="Video"
            variant="indigo"
            to="/videos"
          />

          <StatCard
            :title="t('dashboard.marketNews')"
            :value="overview?.stats.totalNews ?? 0"
            :loading="isLoading"
            :icon="Newspaper"
            variant="blue"
            to="/news"
          />

          <StatCard
            :title="t('dashboard.services')"
            :value="overview?.stats.totalServices ?? 0"
            :loading="isLoading"
            :icon="Briefcase"
            variant="amber"
            to="/services"
          />
        </div>

        <!-- Main Dashboard Section (Trends, Tables & Insights) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <!-- Left Column (2 Cols) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Weekly User & Activity Trends -->
            <TrendAnalyticsCard
              :user-trend="overview?.userRegistrationTrend"
              :activity-trend="overview?.activityTrend"
              :loading="isLoading"
            />

            <!-- Recent Real-Time Activities Table -->
            <ActivityTable
              :activities="overview?.recentActivities"
              :loading="isLoading"
            />
          </div>

          <!-- Right Column (1 Col) -->
          <div class="lg:col-span-1 space-y-6">
            <!-- Quick Actions Panel -->
            <QuickActions />

            <!-- Content Distribution Progress Card -->
            <ContentDistributionCard
              :distribution="overview?.contentDistribution"
              :loading="isLoading"
            />

            <!-- Top Categories Summary Card -->
            <CategoriesSummaryCard
              :article-categories="overview?.topArticleCategories"
              :video-categories="overview?.topVideoCategories"
              :loading="isLoading"
            />
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>
