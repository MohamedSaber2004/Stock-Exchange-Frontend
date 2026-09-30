<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import QuickActions from '@/components/dashboard/QuickActions.vue'
import ActivityTable from '@/components/dashboard/ActivityTable.vue'
import { FileText, Video, Newspaper, Users, UserCheck, Globe } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-7xl mx-auto">
      <!-- Greeting Header -->
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {{ t('dashboard.greeting') }}
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          {{ t('dashboard.subtitle') }}
        </p>
      </div>

      <!-- Stats Grid: 3 top columns -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        <StatCard
          :title="t('dashboard.articles')"
          value="128"
          :icon="FileText"
        />
        <StatCard
          :title="t('dashboard.videos')"
          value="46"
          :icon="Video"
        />
        <StatCard
          :title="t('dashboard.marketNews')"
          value="24"
          :icon="Newspaper"
        />
      </div>

      <!-- Users & Countries Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        <StatCard
          :title="t('dashboard.activeUsers')"
          value="12,480"
          :icon="Users"
        />
        <StatCard
          :title="t('dashboard.subscribedUsers')"
          value="3,284"
          :icon="UserCheck"
        />
        <StatCard
          :title="t('nav.countries')"
          value="18"
          :icon="Globe"
        />
      </div>

      <!-- Quick Actions & Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        <div class="lg:col-span-1">
          <QuickActions />
        </div>
        <div class="lg:col-span-2">
          <ActivityTable />
        </div>
      </div>
    </div>
  </AppShell>
</template>
