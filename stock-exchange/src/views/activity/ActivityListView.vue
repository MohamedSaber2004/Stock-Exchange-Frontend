<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import DataState from '@/components/ui/DataState.vue'
import { 
  Activity, 
  Search, 
  RefreshCw, 
  Eye, 
  X, 
  Users
} from 'lucide-vue-next'
import { coreServices } from '@/di'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { 
  ActivityResourceType, 
  type ActivityLogDto, 
  type ActivityLogsSummaryDto 
} from '@/domain/models/activity-log.model'
import type { AppError } from '@/domain/models/common.model'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'

const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

// State
const logs = ref<ActivityLogDto[]>([])
const summary = ref<ActivityLogsSummaryDto | null>(null)
const isLoading = ref(true)
const isRefreshing = ref(false)
const errorMessage = ref<string | null>(null)

// Filter & Search State
const searchQuery = ref('')
const selectedType = ref<string>('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const totalCount = ref(0)

// Modal State
const selectedLog = ref<ActivityLogDto | null>(null)
const isDetailsOpen = ref(false)

// Fetch Data
const fetchLogs = async (showLoading = true) => {
  if (showLoading) {
    isLoading.value = true
  } else {
    isRefreshing.value = true
  }
  errorMessage.value = null

  try {
    const response = await coreServices.activityLogs.getAll({
      search: searchQuery.value.trim() || undefined,
      resourceType: selectedType.value !== '' ? Number(selectedType.value) : undefined,
      pageNumber: currentPage.value,
      pageSize: pageSize.value
    })

    const currentUser = coreServices.tokenStore.getUser()
    const currentUserId = currentUser?.id
    const currentUserEmail = currentUser?.email?.toLowerCase().trim()

    // Filter out current user's own logs so they only see logs of other users
    const items = response.logs?.items || []
    logs.value = items.filter(item => {
      if (currentUserId && item.userId === currentUserId) return false
      if (currentUserEmail && item.userEmail && item.userEmail.toLowerCase().trim() === currentUserEmail) return false
      return true
    })

    totalPages.value = response.logs?.totalPages || 1
    totalCount.value = response.logs?.totalCount || 0
    summary.value = response.summary
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'فشل تحميل سجل النشاطات' : 'Failed to load activity logs')
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// Search debounce
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchLogs(false)
  }, 350)
})

watch(selectedType, () => {
  currentPage.value = 1
  fetchLogs(true)
})

watch(currentPage, () => {
  fetchLogs(true)
})

onMounted(() => {
  fetchLogs(true)
})

// Helpers
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    return d.toLocaleString(isAr.value ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

const openDetails = (log: ActivityLogDto) => {
  selectedLog.value = log
  isDetailsOpen.value = true
}

const closeDetails = () => {
  selectedLog.value = null
  isDetailsOpen.value = false
}

const handleRefresh = async () => {
  await fetchLogs(false)
  toast.success(isAr.value ? 'تم تحديث سجل الأنشطة' : 'Activity logs refreshed')
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedType.value = ''
  currentPage.value = 1
}

const getResourceTypeLabel = (log: ActivityLogDto) => {
  if (isAr.value && log.resourceTypeArabic) return log.resourceTypeArabic
  if (!isAr.value && log.resourceTypeEnglish) return log.resourceTypeEnglish
  if (log.resourceTypeTitle) return log.resourceTypeTitle

  switch (log.resourceType) {
    case ActivityResourceType.UserRegistrations: return t('activity.userRegistrations')
    case ActivityResourceType.Users: return t('activity.users')
    case ActivityResourceType.Articles: return t('activity.articles')
    case ActivityResourceType.Videos: return t('activity.videos')
    case ActivityResourceType.News: return t('activity.news')
    case ActivityResourceType.SubscriptionPlans: return t('activity.subscriptionPlans')
    case ActivityResourceType.HelpCenter: return t('activity.helpCenter')
    case ActivityResourceType.AboutUs: return t('activity.aboutUs')
    case ActivityResourceType.TermsAndConditions: return t('activity.termsAndConditions')
    case ActivityResourceType.PrivacyPolicy: return t('activity.privacyPolicy')
    default: return log.resourceTypeName || t('activity.typeSystem')
  }
}

const getResourceTypeBadgeClass = (type: ActivityResourceType | number) => {
  switch (type) {
    case ActivityResourceType.UserRegistrations:
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case ActivityResourceType.Users:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case ActivityResourceType.Articles:
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case ActivityResourceType.Videos:
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case ActivityResourceType.News:
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case ActivityResourceType.SubscriptionPlans:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case ActivityResourceType.TermsAndConditions:
    case ActivityResourceType.PrivacyPolicy:
      return 'bg-teal-50 text-teal-700 border-teal-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-7xl mx-auto">
      <!-- Page Header -->
      <PageHeader
        :title="t('activity.title')"
        :description="t('activity.subtitle')"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            @click="handleRefresh"
            :disabled="isRefreshing || isLoading"
            class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            :title="t('activity.refresh')"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
            <span>{{ t('activity.refresh') }}</span>
          </button>
        </div>
      </PageHeader>

      <!-- Stat Summary Badges (Total Logs and Users Count Only) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <!-- Total Logs Card -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Activity class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('activity.totalLogs') }}</div>
            <div class="text-lg font-black text-slate-900">{{ summary?.totalLogs ?? totalCount }}</div>
          </div>
        </div>

        <!-- Users Count Card -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('activity.users') }}</div>
            <div class="text-lg font-black text-indigo-600">{{ summary?.usersCount ?? 0 }}</div>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('activity.searchPlaceholder')"
            class="w-full bg-slate-50/80 border border-slate-200 rounded-xl ps-10 pe-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <!-- Resource Type Filter -->
        <div class="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            v-model="selectedType"
            class="w-full sm:w-auto flex-1 sm:flex-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="">{{ t('activity.allTypes') }}</option>
            <option :value="String(ActivityResourceType.UserRegistrations)">{{ t('activity.userRegistrations') }}</option>
            <option :value="String(ActivityResourceType.Users)">{{ t('activity.users') }}</option>
            <option :value="String(ActivityResourceType.Articles)">{{ t('activity.articles') }}</option>
            <option :value="String(ActivityResourceType.Videos)">{{ t('activity.videos') }}</option>
            <option :value="String(ActivityResourceType.News)">{{ t('activity.news') }}</option>
            <option :value="String(ActivityResourceType.SubscriptionPlans)">{{ t('activity.subscriptionPlans') }}</option>
            <option :value="String(ActivityResourceType.HelpCenter)">{{ t('activity.helpCenter') }}</option>
            <option :value="String(ActivityResourceType.AboutUs)">{{ t('activity.aboutUs') }}</option>
            <option :value="String(ActivityResourceType.TermsAndConditions)">{{ t('activity.termsAndConditions') }}</option>
            <option :value="String(ActivityResourceType.PrivacyPolicy)">{{ t('activity.privacyPolicy') }}</option>
          </select>

          <button
            v-if="searchQuery || selectedType !== ''"
            type="button"
            @click="clearFilters"
            class="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1 transition-colors cursor-pointer shrink-0"
          >
            {{ t('common.clear') }}
          </button>
        </div>
      </div>

      <!-- Activity Table with DataState -->
      <DataState
        :loading="isLoading"
        :error="errorMessage"
        :empty="!isLoading && logs.length === 0"
        :empty-title="t('activity.noLogsFound')"
        :empty-message="t('activity.noLogsDesc')"
        @retry="fetchLogs(true)"
      >
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-start text-xs min-w-[750px]">
              <thead>
                <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                  <th class="py-3 px-5 text-start">{{ t('activity.actorUser') }}</th>
                  <th class="py-3 px-5 text-start">{{ t('activity.actionPerformed') }}</th>
                  <th class="py-3 px-5 text-start">{{ t('activity.resourceType') }}</th>
                  <th class="py-3 px-5 text-start">{{ t('activity.ipClient') }}</th>
                  <th class="py-3 px-5 text-start">{{ t('activity.timestamp') }}</th>
                  <th class="py-3 px-5 text-end">{{ t('activity.details') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr 
                  v-for="act in logs" 
                  :key="act.id"
                  class="hover:bg-slate-50/70 transition-colors group"
                >
                  <!-- User Actor -->
                  <td class="py-3.5 px-5 text-start">
                    <div class="flex items-center gap-2.5">
                      <img 
                        :src="resolveAttachmentUrl(act.userProfilePictureUrl, 'avatar')" 
                        :alt="act.userName"
                        @error="handleImageError($event, 'avatar')"
                        class="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0 bg-slate-100"
                      />
                      <div class="flex flex-col min-w-0">
                        <span class="font-bold text-slate-900 truncate">{{ act.userName || (isAr ? 'مستخدم' : 'User') }}</span>
                        <span class="text-[10px] text-slate-400 font-medium truncate">{{ act.userEmail || '-' }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Action -->
                  <td class="py-3.5 px-5 text-start">
                    <div class="font-semibold text-slate-700 max-w-sm sm:max-w-md line-clamp-1">
                      {{ isAr ? (act.actionAr || act.action) : (act.actionEn || act.action) }}
                    </div>
                  </td>

                  <!-- Type Badge -->
                  <td class="py-3.5 px-5 text-start">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border',
                        getResourceTypeBadgeClass(act.resourceType)
                      ]"
                    >
                      {{ getResourceTypeLabel(act) }}
                    </span>
                  </td>

                  <!-- IP & Client -->
                  <td class="py-3.5 px-5 text-start">
                    <div class="flex flex-col">
                      <span class="font-mono text-[11px] text-slate-600" dir="ltr">{{ act.ipAddress || '-' }}</span>
                      <span class="text-[10px] text-slate-400 truncate max-w-[140px]">{{ act.device || '-' }}</span>
                    </div>
                  </td>

                  <!-- Timestamp -->
                  <td class="py-3.5 px-5 text-start">
                    <div class="flex flex-col">
                      <span class="font-semibold text-slate-800">
                        {{ isAr ? (act.timeAgoArabic || act.timeAgo) : (act.timeAgoEnglish || act.timeAgo) }}
                      </span>
                      <span class="text-[10px] text-slate-400 font-medium">{{ formatDate(act.createdAt) }}</span>
                    </div>
                  </td>

                  <!-- Details Action Button -->
                  <td class="py-3.5 px-5 text-end">
                    <button
                      type="button"
                      @click="openDetails(act)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                      title="View Log Details"
                    >
                      <Eye class="w-4 h-4" />
                      <span class="hidden sm:inline">{{ t('activity.inspect') }}</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span class="text-xs font-medium text-slate-500">
              {{ t('activity.showingEntries', { current: logs.length, total: totalCount }) }}
            </span>
            <AppPagination
              v-model:current-page="currentPage"
              :total-pages="totalPages"
            />
          </div>
        </div>
      </DataState>
    </div>

    <!-- Log Details Modal (Event Inspector) -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="isDetailsOpen && selectedLog"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        @click.self="closeDetails"
      >
        <div class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl animate-in fade-in">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">{{ t('activity.eventInspector') }}</h3>
                <span class="text-[10px] font-mono text-slate-400" dir="ltr">{{ selectedLog.formattedId || selectedLog.id }}</span>
              </div>
            </div>
            <button
              type="button"
              @click="closeDetails"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 flex flex-col gap-4 text-xs">
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-slate-500 uppercase text-[10px]">{{ t('activity.actor') }}</span>
                <span class="font-bold text-slate-800 text-end">{{ selectedLog.userName }} ({{ selectedLog.userEmail || '-' }})</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-slate-500 uppercase text-[10px]">{{ t('activity.resourceType') }}</span>
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border',
                    getResourceTypeBadgeClass(selectedLog.resourceType)
                  ]"
                >
                  {{ getResourceTypeLabel(selectedLog) }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-slate-500 uppercase text-[10px]">{{ t('activity.timestamp') }}</span>
                <span class="font-medium text-slate-700 text-end">
                  {{ formatDate(selectedLog.createdAt) }} ({{ isAr ? (selectedLog.timeAgoArabic || selectedLog.timeAgo) : (selectedLog.timeAgoEnglish || selectedLog.timeAgo) }})
                </span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-slate-500 uppercase text-[10px]">{{ t('activity.clientIp') }}</span>
                <span class="font-mono text-slate-700" dir="ltr">{{ selectedLog.ipAddress || '-' }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-slate-500 uppercase text-[10px]">{{ t('activity.userAgent') }}</span>
                <span class="text-slate-700 text-end">{{ selectedLog.device || '-' }}</span>
              </div>
            </div>

            <!-- Action Summary -->
            <div>
              <span class="font-bold text-slate-800 text-xs block mb-1.5">{{ t('activity.actionSummary') }}</span>
              <p class="p-3 rounded-xl bg-emerald-50/40 text-emerald-950 font-medium border border-emerald-100/60 leading-relaxed">
                {{ isAr ? (selectedLog.actionAr || selectedLog.action) : (selectedLog.actionEn || selectedLog.action) }}
              </p>
            </div>

            <!-- Additional Details if provided by backend -->
            <div v-if="selectedLog.details || selectedLog.detailsAr || selectedLog.detailsEn">
              <span class="font-bold text-slate-800 text-xs block mb-1.5">{{ t('activity.details') }}</span>
              <p class="p-3 rounded-xl bg-slate-50 text-slate-700 font-mono text-[11px] border border-slate-100 leading-relaxed break-words whitespace-pre-wrap">
                {{ isAr ? (selectedLog.detailsAr || selectedLog.details) : (selectedLog.detailsEn || selectedLog.details) }}
              </p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-3.5 border-t border-slate-100 flex justify-end bg-slate-50/50">
            <button
              type="button"
              @click="closeDetails"
              class="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs text-center"
            >
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </AppShell>
</template>
