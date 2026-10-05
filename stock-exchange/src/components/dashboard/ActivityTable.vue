<script setup lang="ts">
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'
import { coreServices } from '@/di'
import type { OverviewActivityLogDto } from '@/domain/models/overview.model'

interface Props {
  activities?: OverviewActivityLogDto[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  activities: () => [],
  loading: false
})

const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const currentUser = computed(() => {
  try {
    return coreServices.tokenStore.getUser()
  } catch {
    return null
  }
})

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSec < 60) return isAr.value ? 'الآن' : 'Just now'
  if (diffMin < 60) return isAr.value ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`
  if (diffHours < 24) return isAr.value ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`
  return isAr.value ? `منذ ${diffDays} يوم` : `${diffDays}d ago`
}

const getResourceTypeLabel = (type: string) => {
  switch (type.toLowerCase()) {
    case 'userregistrations':
    case 'users':
      return isAr.value ? 'مستخدم' : 'User'
    case 'articles':
      return isAr.value ? 'مقال' : 'Article'
    case 'videos':
      return isAr.value ? 'فيديو' : 'Video'
    case 'news':
      return isAr.value ? 'أخبار' : 'News'
    case 'services':
      return isAr.value ? 'خدمة' : 'Service'
    case 'helpcenter':
      return isAr.value ? 'مركز المساعدة' : 'Help Center'
    case 'subscriptionplans':
      return isAr.value ? 'خطط الاشتراك' : 'Subscription'
    default:
      return type
  }
}

const getBadgeVariant = (type: string): 'info' | 'success' | 'warning' | 'neutral' => {
  switch (type.toLowerCase()) {
    case 'userregistrations':
    case 'users':
      return 'success'
    case 'articles':
    case 'news':
      return 'info'
    case 'videos':
      return 'warning'
    default:
      return 'neutral'
  }
}

const getUserInitials = (name?: string) => {
  if (!name) return 'AD'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || 'A'
  const second = parts[1]?.[0] || ''
  return (first + second).toUpperCase()
}

const activitiesList = computed(() => {
  const currentUserId = currentUser.value?.id
  const currentUserEmail = currentUser.value?.email?.toLowerCase().trim()
  const list = props.activities || []
  return list.filter(item => {
    if (currentUserId && item.userId === currentUserId) return false
    if (currentUserEmail && item.userEmail && item.userEmail.toLowerCase().trim() === currentUserEmail) return false
    return true
  })
})
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
    <div class="p-4 border-b border-slate-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {{ t('dashboard.recentActivity') }}
        </h3>
      </div>
      <RouterLink 
        to="/activity" 
        class="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1 group cursor-pointer"
      >
        <span>{{ t('dashboard.viewAll') }}</span>
        <span class="group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180 transition-transform">→</span>
      </RouterLink>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="p-4 divide-y divide-slate-100">
      <div v-for="i in 5" :key="i" class="py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
          <div class="space-y-1.5">
            <div class="h-3.5 w-28 bg-slate-200 animate-pulse rounded"></div>
            <div class="h-2.5 w-40 bg-slate-100 animate-pulse rounded"></div>
          </div>
        </div>
        <div class="h-5 w-16 bg-slate-100 animate-pulse rounded-full"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="activitiesList.length === 0" class="p-8 text-center">
      <p class="text-xs text-slate-400 font-medium">
        {{ t('dashboard.noData') }}
      </p>
    </div>

    <!-- Real Activity List -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-start text-xs min-w-[500px]">
        <thead>
          <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/40">
            <th class="py-2.5 px-4 text-start">{{ t('dashboard.userCol') }}</th>
            <th class="py-2.5 px-4 text-start">{{ t('dashboard.actionCol') }}</th>
            <th class="py-2.5 px-4 text-start">{{ t('dashboard.typeCol') }}</th>
            <th class="py-2.5 px-4 text-start">{{ t('dashboard.timeCol') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr 
            v-for="act in activitiesList" 
            :key="act.id" 
            class="hover:bg-slate-50/60 transition-colors"
          >
            <td class="py-3 px-4 text-start">
              <div class="flex items-center gap-2.5">
                <div class="relative shrink-0">
                  <img
                    v-if="act.userProfilePictureUrl"
                    :src="resolveAttachmentUrl(act.userProfilePictureUrl)"
                    :alt="act.userName"
                    class="w-7 h-7 rounded-full object-cover border border-slate-200"
                    @error="handleImageError"
                  />
                  <div
                    v-else
                    class="w-7 h-7 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 text-white text-[10px] font-bold flex items-center justify-center shadow-2xs"
                  >
                    {{ getUserInitials(act.userName) }}
                  </div>
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-slate-800 truncate">{{ act.userName || 'Admin' }}</div>
                  <div v-if="act.userEmail" class="text-[10px] text-slate-400 truncate">{{ act.userEmail }}</div>
                </div>
              </div>
            </td>

            <td class="py-3 px-4 text-slate-600 font-medium text-start max-w-[240px] truncate">
              {{ isAr ? (act.actionAr || act.action) : (act.actionEn || act.action) }}
            </td>

            <td class="py-3 px-4 text-start">
              <StatusBadge :status="act.resourceType" :variant="getBadgeVariant(act.resourceType)">
                {{ getResourceTypeLabel(act.resourceType) }}
              </StatusBadge>
            </td>

            <td class="py-3 px-4 text-slate-400 font-medium text-start whitespace-nowrap">
              {{ formatTimeAgo(act.createdAt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
