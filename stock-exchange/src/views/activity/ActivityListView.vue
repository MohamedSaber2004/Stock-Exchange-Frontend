<script setup lang="ts">
import { ref, computed } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { 
  Activity, 
  Search, 
  Download, 
  RefreshCw, 
  Eye, 
  X, 
  CreditCard, 
  UserCheck, 
  FileText, 
  Video, 
  ShieldAlert,
  Calendar,
  Layers
} from 'lucide-vue-next'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

export interface ActivityRecord {
  id: string
  user: string
  userAr?: string
  email: string
  avatar?: string
  action: string
  actionAr?: string
  type: 'Payment' | 'User' | 'Article' | 'Video' | 'News' | 'System'
  status: 'success' | 'warning' | 'info' | 'error'
  ipAddress: string
  device: string
  timestamp: string
  timestampAr?: string
  fullDate: string
  details?: Record<string, any>
}

const activities = ref<ActivityRecord[]>([
  {
    id: 'act-001',
    user: 'Ahmed Mohamed',
    userAr: 'أحمد محمد',
    email: 'ahmed.m@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    action: 'Subscribed to Pro Annual Plan ($120.00)',
    actionAr: 'اشترك بالخطة الاحترافية السنوية ($120.00)',
    type: 'Payment',
    status: 'success',
    ipAddress: '197.38.12.94',
    device: 'Chrome on macOS',
    timestamp: '2m ago',
    timestampAr: 'منذ دقيقتين',
    fullDate: '2026-09-29 11:23:40',
    details: { plan: 'Pro Annual', amount: 120.00, gateway: 'Stripe', transactionId: 'tx_99214731' }
  },
  {
    id: 'act-002',
    user: 'Sara Ali',
    userAr: 'سارة علي',
    email: 'sara.ali@outlook.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    action: 'Registered new user account via Email',
    actionAr: 'أنشأت حساب مستخدم جديد عبر البريد الإلكتروني',
    type: 'User',
    status: 'success',
    ipAddress: '156.204.88.19',
    device: 'Safari on iPhone 15',
    timestamp: '8m ago',
    timestampAr: 'منذ 8 دقائق',
    fullDate: '2026-09-29 11:17:12',
    details: { authMethod: 'Email/Password', verified: true, country: 'Egypt' }
  },
  {
    id: 'act-003',
    user: 'Admin (You)',
    userAr: 'المدير (أنت)',
    email: 'admin@finwise.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    action: 'Created educational article "Gold Hits All-Time High"',
    actionAr: 'نشر مقال تعليمي "الذهب يسجل أعلى مستوياته التاريخية"',
    type: 'Article',
    status: 'info',
    ipAddress: '192.168.1.1',
    device: 'Firefox on Windows 11',
    timestamp: '15m ago',
    timestampAr: 'منذ 15 دقيقة',
    fullDate: '2026-09-29 11:10:05',
    details: { articleId: 'art-101', tier: 'Free', category: 'Commodities' }
  },
  {
    id: 'act-004',
    user: 'Mohamed Hassan',
    userAr: 'محمد حسن',
    email: 'm.hassan@finwise.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    action: 'Uploaded new technical analysis video "EGX30 Breakout"',
    actionAr: 'رفع فيديو تحليل فني جديد "اختراق مؤشر EGX30"',
    type: 'Video',
    status: 'info',
    ipAddress: '41.233.10.4',
    device: 'Chrome on Windows 11',
    timestamp: '35m ago',
    timestampAr: 'منذ 35 دقيقة',
    fullDate: '2026-09-29 10:50:00',
    details: { videoId: 'vid-88', source: 'YouTube', duration: '14:20', tier: 'Pro' }
  },
  {
    id: 'act-005',
    user: 'Mona Zaki',
    userAr: 'منى زكي',
    email: 'mona.zaki@yahoo.com',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    action: 'Upgraded subscription tier to Elite Trader Plan',
    actionAr: 'ترقية باقة الاشتراك إلى خطة المتداول النخبة',
    type: 'Payment',
    status: 'success',
    ipAddress: '102.45.19.22',
    device: 'Edge on Windows 10',
    timestamp: '1h ago',
    timestampAr: 'منذ ساعة',
    fullDate: '2026-09-29 10:22:15',
    details: { oldPlan: 'Pro Monthly', newPlan: 'Elite Trader', proratedAmount: 45.00 }
  },
  {
    id: 'act-006',
    user: 'System Bot',
    userAr: 'نظام آلي',
    email: 'cron@finwise.internal',
    action: 'Automated daily backup and cache refresh completed',
    actionAr: 'اكتمال النسخ الاحتياطي اليومي وتحديث الذاكرة المؤقتة',
    type: 'System',
    status: 'info',
    ipAddress: '127.0.0.1',
    device: 'Internal Worker Node',
    timestamp: '2h ago',
    timestampAr: 'منذ ساعتين',
    fullDate: '2026-09-29 09:00:00',
    details: { executionTimeMs: 412, recordsProcessed: 1420 }
  },
  {
    id: 'act-007',
    user: 'Karim Adel',
    userAr: 'كريم عادل',
    email: 'karim.adel@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    action: 'Password reset request completed successfully',
    actionAr: 'تمت معالجة طلب إعادة تعيين كلمة المرور بنجاح',
    type: 'User',
    status: 'warning',
    ipAddress: '196.12.80.11',
    device: 'Safari on iPad Pro',
    timestamp: '3h ago',
    timestampAr: 'منذ 3 ساعات',
    fullDate: '2026-09-29 08:14:30',
    details: { method: 'OTP via SMS', verifiedAt: '2026-09-29 08:14:28' }
  },
  {
    id: 'act-008',
    user: 'Admin (You)',
    userAr: 'المدير (أنت)',
    email: 'admin@finwise.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    action: 'Published breaking news "Central Bank announces interest rate decision"',
    actionAr: 'نشر خبر عاجل "البنك المركزي يعلن قرار أسعار الفائدة"',
    type: 'News',
    status: 'info',
    ipAddress: '192.168.1.1',
    device: 'Firefox on Windows 11',
    timestamp: '5h ago',
    timestampAr: 'منذ 5 ساعات',
    fullDate: '2026-09-29 06:30:19',
    details: { newsId: 'news-901', bannerPinned: true, source: 'Central Bank Bulletin' }
  }
])

// Filter & Search State
const searchQuery = ref('')
const selectedType = ref('All')
const currentPage = ref(1)
const itemsPerPage = ref(6)

// Filtered List
const filteredActivities = computed(() => {
  return activities.value.filter(item => {
    const matchesSearch = 
      item.user.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.action.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.ipAddress.includes(searchQuery.value)
      
    const matchesType = selectedType.value === 'All' || item.type === selectedType.value

    return matchesSearch && matchesType
  })
})

const totalPages = computed(() => Math.ceil(filteredActivities.value.length / itemsPerPage.value) || 1)

const paginatedActivities = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredActivities.value.slice(start, start + itemsPerPage.value)
})

// Metrics summary
const totalEvents = computed(() => activities.value.length)
const paymentEvents = computed(() => activities.value.filter(a => a.type === 'Payment').length)
const userEvents = computed(() => activities.value.filter(a => a.type === 'User').length)
const contentEvents = computed(() => activities.value.filter(a => ['Article', 'Video', 'News'].includes(a.type)).length)

// Modal State
const selectedLog = ref<ActivityRecord | null>(null)
const isDetailsOpen = ref(false)

const openDetails = (log: ActivityRecord) => {
  selectedLog.value = log
  isDetailsOpen.value = true
}

const closeDetails = () => {
  selectedLog.value = null
  isDetailsOpen.value = false
}

const handleExport = () => {
  const csvContent = 'data:text/csv;charset=utf-8,' +
    ['ID,User,Email,Action,Type,Status,IP,Device,Timestamp,Date']
      .concat(filteredActivities.value.map(a => 
        `"${a.id}","${a.user}","${a.email}","${a.action}","${a.type}","${a.status}","${a.ipAddress}","${a.device}","${a.timestamp}","${a.fullDate}"`
      )).join('\n')
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `finwise_activity_log_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  toast.success(isAr.value ? 'تم تصدير سجلات النشاط بنجاح إلى ملف CSV!' : 'Activity logs exported successfully to CSV!')
}

const handleRefresh = () => {
  toast.info(isAr.value ? 'تم تحديث سجلات النشاط بأحدث الأحداث' : 'Activity logs updated with latest events')
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedType.value = 'All'
  currentPage.value = 1
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'Payment': return t('activity.payments')
    case 'User': return t('activity.userAuth')
    case 'Article': return t('nav.articles')
    case 'Video': return t('nav.videos')
    case 'News': return t('nav.news')
    case 'System': return t('activity.typeSystem')
    default: return type
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
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="handleRefresh"
            class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw class="w-3.5 h-3.5" />
            <span>{{ t('activity.refresh') }}</span>
          </button>
          <button
            type="button"
            @click="handleExport"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            <span>{{ t('activity.exportCsv') }}</span>
          </button>
        </div>
      </PageHeader>

      <!-- Stat Summary Badges -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Activity class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('activity.totalLogs') }}</div>
            <div class="text-lg font-black text-slate-900">{{ totalEvents }}</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CreditCard class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('activity.payments') }}</div>
            <div class="text-lg font-black text-emerald-600">{{ paymentEvents }}</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserCheck class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('activity.userAuth') }}</div>
            <div class="text-lg font-black text-blue-600">{{ userEvents }}</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('activity.contentOps') }}</div>
            <div class="text-lg font-black text-amber-600">{{ contentEvents }}</div>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div class="relative w-full md:w-80">
          <Search class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('activity.searchPlaceholder')"
            class="w-full bg-slate-50/80 border border-slate-200 rounded-xl ps-10 pe-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div class="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          <!-- Type Filter -->
          <select
            v-model="selectedType"
            class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All">{{ t('common.all') }} {{ t('activity.resourceType') }}</option>
            <option value="Payment">{{ t('activity.payments') }}</option>
            <option value="User">{{ t('activity.userAuth') }}</option>
            <option value="Article">{{ t('nav.articles') }}</option>
            <option value="Video">{{ t('nav.videos') }}</option>
            <option value="News">{{ t('nav.news') }}</option>
            <option value="System">{{ t('activity.typeSystem') }}</option>
          </select>

          <button
            v-if="searchQuery || selectedType !== 'All'"
            type="button"
            @click="clearFilters"
            class="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1 transition-colors cursor-pointer shrink-0"
          >
            {{ t('common.clear') }}
          </button>
        </div>
      </div>

      <!-- Activity Table -->
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
                v-for="act in paginatedActivities" 
                :key="act.id"
                class="hover:bg-slate-50/70 transition-colors group"
              >
                <!-- User Actor -->
                <td class="py-3.5 px-5 text-start">
                  <div class="flex items-center gap-2.5">
                    <img 
                      v-if="act.avatar" 
                      :src="act.avatar" 
                      :alt="act.user"
                      class="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                    />
                    <div v-else class="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {{ act.user.charAt(0) }}
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="font-bold text-slate-900 truncate">{{ isAr && act.userAr ? act.userAr : act.user }}</span>
                      <span class="text-[10px] text-slate-400 font-medium truncate">{{ act.email }}</span>
                    </div>
                  </div>
                </td>

                <!-- Action -->
                <td class="py-3.5 px-5 text-start">
                  <div class="font-semibold text-slate-700 max-w-sm sm:max-w-md line-clamp-1">
                    {{ isAr && act.actionAr ? act.actionAr : act.action }}
                  </div>
                </td>

                <!-- Type Badge -->
                <td class="py-3.5 px-5 text-start">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold',
                      act.type === 'Payment' ? 'bg-emerald-100 text-emerald-700' :
                      act.type === 'User' ? 'bg-blue-100 text-blue-700' :
                      act.type === 'Article' ? 'bg-purple-100 text-purple-700' :
                      act.type === 'Video' ? 'bg-indigo-100 text-indigo-700' :
                      act.type === 'News' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    ]"
                  >
                    {{ getTypeLabel(act.type) }}
                  </span>
                </td>

                <!-- IP & Client -->
                <td class="py-3.5 px-5 text-start">
                  <div class="flex flex-col">
                    <span class="font-mono text-[11px] text-slate-600" dir="ltr">{{ act.ipAddress }}</span>
                    <span class="text-[10px] text-slate-400">{{ act.device }}</span>
                  </div>
                </td>

                <!-- Timestamp -->
                <td class="py-3.5 px-5 text-start">
                  <div class="flex flex-col">
                    <span class="font-semibold text-slate-800">{{ isAr && act.timestampAr ? act.timestampAr : act.timestamp }}</span>
                    <span class="text-[10px] text-slate-400 font-medium">{{ act.fullDate }}</span>
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

              <tr v-if="filteredActivities.length === 0">
                <td colspan="6" class="py-12 text-center text-slate-400">
                  <Activity class="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p class="font-bold text-slate-700 text-sm">{{ t('activity.noLogsFound') }}</p>
                  <p class="text-xs text-slate-400 mt-0.5">{{ t('activity.noLogsDesc') }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span class="text-xs font-medium text-slate-500">
            {{ t('activity.showingEntries', { current: paginatedActivities.length, total: filteredActivities.length }) }}
          </span>
          <AppPagination
            :current-page="currentPage"
            :total-pages="totalPages"
            @change="(page) => currentPage = page"
          />
        </div>
      </div>
    </div>

    <!-- Log Details Modal -->
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
      >
        <div class="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">{{ t('activity.eventInspector') }}</h3>
                <span class="text-[10px] font-mono text-slate-400" dir="ltr">{{ selectedLog.id }}</span>
              </div>
            </div>
            <button
              type="button"
              @click="closeDetails"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 flex flex-col gap-4 text-xs">
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-500 uppercase text-[10px]">{{ t('activity.actor') }}</span>
                <span class="font-bold text-slate-800">{{ isAr && selectedLog.userAr ? selectedLog.userAr : selectedLog.user }} ({{ selectedLog.email }})</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-500 uppercase text-[10px]">{{ t('activity.timestamp') }}</span>
                <span class="font-medium text-slate-700">{{ selectedLog.fullDate }} ({{ isAr && selectedLog.timestampAr ? selectedLog.timestampAr : selectedLog.timestamp }})</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-500 uppercase text-[10px]">{{ t('activity.clientIp') }}</span>
                <span class="font-mono text-slate-700" dir="ltr">{{ selectedLog.ipAddress }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-500 uppercase text-[10px]">{{ t('activity.userAgent') }}</span>
                <span class="text-slate-700">{{ selectedLog.device }}</span>
              </div>
            </div>

            <div>
              <span class="font-bold text-slate-800 text-xs block mb-1.5">{{ t('activity.actionSummary') }}</span>
              <p class="p-3 rounded-xl bg-emerald-50/40 text-emerald-950 font-medium border border-emerald-100/60 leading-relaxed">
                {{ isAr && selectedLog.actionAr ? selectedLog.actionAr : selectedLog.action }}
              </p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-3.5 border-t border-slate-100 flex justify-end bg-slate-50/50">
            <button
              type="button"
              @click="closeDetails"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </AppShell>
</template>
