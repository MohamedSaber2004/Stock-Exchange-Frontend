<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Bell,
  Plus,
  Send,
  Trash2,
  Eye,
  Search,
  Filter,
  Users,
  Clock,
  CheckCheck,
  AlertCircle,
  X,
  Megaphone,
  TrendingUp,
  FileText,
  Video,
  ChevronDown,
  type LucideIcon
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const { toast, confirm } = useFeedback()
const { locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

// ── Types ────────────────────────────────────────────────────────────────────
type NotifStatus = 'sent' | 'scheduled' | 'draft' | 'failed'
type NotifTarget = 'all' | 'free' | 'basic' | 'pro'
type NotifCategory = 'news' | 'article' | 'video' | 'promo' | 'system'

interface Notification {
  id: string
  title: string
  titleAr: string
  body: string
  bodyAr: string
  category: NotifCategory
  target: NotifTarget
  status: NotifStatus
  sentAt?: string
  scheduledAt?: string
  reach: number
  readCount: number
}

// ── State ────────────────────────────────────────────────────────────────────
const search = ref('')
const selectedStatus = ref<NotifStatus | 'all'>('all')
const isCreateModalOpen = ref(false)
const isPreviewModalOpen = ref(false)
const previewingItem = ref<Notification | null>(null)
const isStatusOpen = ref(false)

// New notification form
const newNotif = ref({
  title: '',
  titleAr: '',
  body: '',
  bodyAr: '',
  category: 'news' as NotifCategory,
  target: 'all' as NotifTarget,
  scheduleType: 'now' as 'now' | 'later',
  scheduledAt: ''
})

// ── Mock Data ─────────────────────────────────────────────────────────────────
const notifications = ref<Notification[]>([
  {
    id: 'notif-1',
    title: 'New Market Analysis Available',
    titleAr: 'تحليل السوق الجديد متاح الآن',
    body: 'A new in-depth market analysis has been published. Check it out now!',
    bodyAr: 'تم نشر تحليل معمق جديد للسوق. اطلع عليه الآن!',
    category: 'article',
    target: 'pro',
    status: 'sent',
    sentAt: '2 hours ago',
    reach: 1240,
    readCount: 876
  },
  {
    id: 'notif-2',
    title: 'Breaking: Central Bank Announcement',
    titleAr: 'عاجل: إعلان البنك المركزي',
    body: 'The Central Bank has announced new interest rate decisions. Stay informed.',
    bodyAr: 'أعلن البنك المركزي عن قرارات جديدة بشأن أسعار الفائدة.',
    category: 'news',
    target: 'all',
    status: 'sent',
    sentAt: 'Yesterday',
    reach: 5820,
    readCount: 4310
  },
  {
    id: 'notif-3',
    title: 'New Video Course: Technical Analysis',
    titleAr: 'دورة فيديو جديدة: التحليل الفني',
    body: 'A new expert video course on technical analysis is now live. Watch it now!',
    bodyAr: 'دورة فيديو جديدة من الخبراء في التحليل الفني متاحة الآن.',
    category: 'video',
    target: 'pro',
    status: 'scheduled',
    scheduledAt: 'Tomorrow, 10:00 AM',
    reach: 0,
    readCount: 0
  },
  {
    id: 'notif-4',
    title: 'Upgrade to Pro — Limited Offer',
    titleAr: 'ترقية للاشتراك المميز — عرض محدود',
    body: 'Get 30% off your first Pro subscription. Offer ends this Friday!',
    bodyAr: 'احصل على خصم 30% على أول اشتراك مميز. العرض ينتهي الجمعة!',
    category: 'promo',
    target: 'basic',
    status: 'sent',
    sentAt: '3 days ago',
    reach: 2100,
    readCount: 1050
  },
  {
    id: 'notif-5',
    title: 'Weekly Market Newsletter',
    titleAr: 'النشرة الأسبوعية للسوق',
    body: 'Your weekly market summary is ready. See what happened this week.',
    bodyAr: 'ملخصك الأسبوعي للسوق جاهز. اكتشف ما حدث هذا الأسبوع.',
    category: 'news',
    target: 'basic',
    status: 'draft',
    reach: 0,
    readCount: 0
  },
  {
    id: 'notif-6',
    title: 'System Maintenance Tonight',
    titleAr: 'صيانة النظام الليلة',
    body: 'The app will be under maintenance from 2–4 AM. We apologize for any inconvenience.',
    bodyAr: 'سيكون التطبيق تحت الصيانة من 2 إلى 4 صباحاً. نعتذر عن أي إزعاج.',
    category: 'system',
    status: 'failed',
    target: 'all',
    reach: 0,
    readCount: 0
  }
])

// ── Computed ──────────────────────────────────────────────────────────────────
const filteredNotifications = computed(() => {
  return notifications.value.filter(n => {
    const q = search.value.toLowerCase()
    const matchSearch = !q ||
      n.title.toLowerCase().includes(q) ||
      n.titleAr.includes(q) ||
      n.body.toLowerCase().includes(q)
    const matchStatus = selectedStatus.value === 'all' || n.status === selectedStatus.value
    return matchSearch && matchStatus
  })
})

const stats = computed(() => ({
  total: notifications.value.length,
  sent: notifications.value.filter(n => n.status === 'sent').length,
  scheduled: notifications.value.filter(n => n.status === 'scheduled').length,
  totalReach: notifications.value.reduce((s, n) => s + n.reach, 0),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusConfig: Record<NotifStatus, { label: string; labelAr: string; class: string }> = {
  sent:      { label: 'Sent',      labelAr: 'مُرسَلة',    class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  scheduled: { label: 'Scheduled', labelAr: 'مجدولة',     class: 'bg-blue-50 text-blue-700 border-blue-200' },
  draft:     { label: 'Draft',     labelAr: 'مسودة',      class: 'bg-slate-100 text-slate-600 border-slate-200' },
  failed:    { label: 'Failed',    labelAr: 'فشلت',       class: 'bg-red-50 text-red-700 border-red-200' },
}

const categoryConfig: Record<NotifCategory, { label: string; labelAr: string; icon: LucideIcon; iconClass: string }> = {
  news:    { label: 'News',    labelAr: 'أخبار',    icon: TrendingUp, iconClass: 'text-red-500 bg-red-50' },
  article: { label: 'Article', labelAr: 'مقال',     icon: FileText,   iconClass: 'text-blue-500 bg-blue-50' },
  video:   { label: 'Video',   labelAr: 'فيديو',    icon: Video,      iconClass: 'text-violet-500 bg-violet-50' },
  promo:   { label: 'Promo',   labelAr: 'عرض',      icon: Megaphone,  iconClass: 'text-amber-500 bg-amber-50' },
  system:  { label: 'System',  labelAr: 'نظام',     icon: AlertCircle, iconClass: 'text-slate-500 bg-slate-100' },
}

const targetConfig: Record<NotifTarget, { label: string; labelAr: string }> = {
  all:   { label: 'All Users',  labelAr: 'جميع المستخدمين' },
  free:  { label: 'Free',       labelAr: 'المجانيين' },
  basic: { label: 'Basic',      labelAr: 'Basic' },
  pro:   { label: 'Pro',        labelAr: 'Pro' },
}

const readRate = (n: Notification) => {
  if (!n.reach) return 0
  return Math.round((n.readCount / n.reach) * 100)
}

// ── Actions ───────────────────────────────────────────────────────────────────
const openPreview = (item: Notification) => {
  previewingItem.value = item
  isPreviewModalOpen.value = true
}

const handleDelete = async (item: Notification) => {
  const ok = await confirm({
    title: isAr.value ? 'حذف الإشعار' : 'Delete Notification',
    message: isAr.value
      ? 'هل أنت متأكد من حذف هذا الإشعار؟'
      : 'Are you sure you want to delete this notification?',
    confirmText: isAr.value ? 'حذف' : 'Delete',
    type: 'danger',
  })
  if (!ok) return
  notifications.value = notifications.value.filter(n => n.id !== item.id)
  toast.success(isAr.value ? 'تم حذف الإشعار' : 'Notification deleted')
}

const handleSend = async (item: Notification) => {
  const ok = await confirm({
    title: isAr.value ? 'إرسال الإشعار' : 'Send Notification',
    message: isAr.value
      ? `سيتم إرسال هذا الإشعار إلى ${targetConfig[item.target].labelAr}`
      : `This notification will be sent to ${targetConfig[item.target].label}`,
    confirmText: isAr.value ? 'إرسال' : 'Send',
  })
  if (!ok) return
  const idx = notifications.value.findIndex(n => n.id === item.id)
  const notifItem = notifications.value[idx]
  if (idx !== -1 && notifItem) {
    notifications.value[idx] = {
      ...notifItem,
      status: 'sent',
      sentAt: 'Just now',
      reach: Math.floor(Math.random() * 3000) + 500,
      readCount: 0,
    }
  }
  toast.success(isAr.value ? 'تم إرسال الإشعار بنجاح' : 'Notification sent successfully')
}

const handleCreate = () => {
  if (!newNotif.value.title.trim() || !newNotif.value.body.trim()) {
    toast.error(isAr.value ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields')
    return
  }

  const n: Notification = {
    id: `notif-${Date.now()}`,
    title: newNotif.value.title,
    titleAr: newNotif.value.titleAr || newNotif.value.title,
    body: newNotif.value.body,
    bodyAr: newNotif.value.bodyAr || newNotif.value.body,
    category: newNotif.value.category,
    target: newNotif.value.target,
    status: newNotif.value.scheduleType === 'now' ? 'sent' : 'scheduled',
    sentAt: newNotif.value.scheduleType === 'now' ? 'Just now' : undefined,
    scheduledAt: newNotif.value.scheduleType === 'later' ? newNotif.value.scheduledAt : undefined,
    reach: newNotif.value.scheduleType === 'now' ? Math.floor(Math.random() * 3000) + 500 : 0,
    readCount: 0,
  }

  notifications.value.unshift(n)
  isCreateModalOpen.value = false
  newNotif.value = { title: '', titleAr: '', body: '', bodyAr: '', category: 'news', target: 'all', scheduleType: 'now', scheduledAt: '' }
  toast.success(isAr.value
    ? newNotif.value.scheduleType === 'now' ? 'تم إرسال الإشعار' : 'تم جدولة الإشعار'
    : n.status === 'sent' ? 'Notification sent successfully' : 'Notification scheduled'
  )
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-6xl mx-auto">

      <!-- Page Header -->
      <PageHeader
        :title="isAr ? 'الإشعارات' : 'Notifications'"
        :description="isAr ? 'إرسال وإدارة إشعارات Push للمستخدمين' : 'Send and manage push notifications to app users'"
      >
        <template #actions>
          <button
            type="button"
            @click="isCreateModalOpen = true"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold shadow-sm transition-all duration-150 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            {{ isAr ? 'إشعار جديد' : 'New Notification' }}
          </button>
        </template>
      </PageHeader>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white rounded-2xl border border-slate-200/70 p-4 flex flex-col gap-1 shadow-xs">
          <span class="text-xs font-semibold text-slate-500">{{ isAr ? 'إجمالي الإشعارات' : 'Total' }}</span>
          <span class="text-2xl font-black text-slate-900">{{ stats.total }}</span>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200/70 p-4 flex flex-col gap-1 shadow-xs">
          <span class="text-xs font-semibold text-slate-500">{{ isAr ? 'مُرسَلة' : 'Sent' }}</span>
          <span class="text-2xl font-black text-emerald-600">{{ stats.sent }}</span>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200/70 p-4 flex flex-col gap-1 shadow-xs">
          <span class="text-xs font-semibold text-slate-500">{{ isAr ? 'مجدولة' : 'Scheduled' }}</span>
          <span class="text-2xl font-black text-blue-600">{{ stats.scheduled }}</span>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200/70 p-4 flex flex-col gap-1 shadow-xs">
          <span class="text-xs font-semibold text-slate-500">{{ isAr ? 'إجمالي الوصول' : 'Total Reach' }}</span>
          <span class="text-2xl font-black text-slate-900">{{ stats.totalReach.toLocaleString() }}</span>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search -->
        <div class="relative flex-1">
          <Search class="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            v-model="search"
            type="text"
            :placeholder="isAr ? 'ابحث في الإشعارات...' : 'Search notifications...'"
            class="w-full bg-white border border-slate-200 rounded-xl ps-9 pe-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
          />
        </div>

        <!-- Status Filter -->
        <div class="relative">
          <button
            type="button"
            @click="isStatusOpen = !isStatusOpen"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer min-w-36"
          >
            <Filter class="w-4 h-4 text-slate-400" />
            <span class="flex-1 text-start">
              {{ selectedStatus === 'all' ? (isAr ? 'كل الحالات' : 'All Status') : (isAr ? statusConfig[selectedStatus as NotifStatus]?.labelAr : statusConfig[selectedStatus as NotifStatus]?.label) }}
            </span>
            <ChevronDown class="w-4 h-4 text-slate-400" :class="{ 'rotate-180': isStatusOpen }" />
          </button>

          <div
            v-if="isStatusOpen"
            class="absolute top-full mt-1.5 start-0 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-44"
            @mouseleave="isStatusOpen = false"
          >
            <button
              type="button"
              v-for="opt in ['all', 'sent', 'scheduled', 'draft', 'failed']"
              :key="opt"
              @click="selectedStatus = opt as any; isStatusOpen = false"
              class="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
              :class="{ 'text-emerald-600 font-bold': selectedStatus === opt }"
            >
              {{ opt === 'all' ? (isAr ? 'كل الحالات' : 'All Status') : (isAr ? statusConfig[opt as NotifStatus]?.labelAr : statusConfig[opt as NotifStatus]?.label) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="flex flex-col gap-3">
        <div
          v-if="filteredNotifications.length === 0"
          class="bg-white rounded-2xl border border-slate-200/70 p-12 flex flex-col items-center gap-3 text-center"
        >
          <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Bell class="w-6 h-6 text-slate-400" />
          </div>
          <p class="text-sm font-semibold text-slate-500">{{ isAr ? 'لا توجد إشعارات' : 'No notifications found' }}</p>
        </div>

        <div
          v-for="item in filteredNotifications"
          :key="item.id"
          class="bg-white rounded-2xl border border-slate-200/70 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all group"
        >
          <div class="flex items-start gap-4">
            <!-- Category Icon -->
            <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', categoryConfig[item.category].iconClass]">
              <component :is="categoryConfig[item.category].icon" class="w-5 h-5" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-sm font-bold text-slate-900 leading-tight">
                    {{ isAr ? item.titleAr : item.title }}
                  </h3>
                  <!-- Status Badge -->
                  <span :class="['text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md border', statusConfig[item.status].class]">
                    {{ isAr ? statusConfig[item.status].labelAr : statusConfig[item.status].label }}
                  </span>
                </div>

                <!-- Action Buttons: always visible on touch/mobile, hover on desktop -->
                <div class="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    @click="openPreview(item)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-all"
                    :title="isAr ? 'معاينة' : 'Preview'"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    v-if="item.status === 'draft' || item.status === 'failed'"
                    type="button"
                    @click="handleSend(item)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-all"
                    :title="isAr ? 'إرسال' : 'Send'"
                  >
                    <Send class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    @click="handleDelete(item)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all"
                    :title="isAr ? 'حذف' : 'Delete'"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Body -->
              <p class="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                {{ isAr ? item.bodyAr : item.body }}
              </p>

              <!-- Meta Row -->
              <div class="flex items-center gap-3 sm:gap-4 mt-2.5 flex-wrap">
                <!-- Target -->
                <div class="flex items-center gap-1 text-xs text-slate-500">
                  <Users class="w-3.5 h-3.5" />
                  <span class="font-medium">{{ isAr ? targetConfig[item.target].labelAr : targetConfig[item.target].label }}</span>
                </div>

                <!-- Category -->
                <div class="flex items-center gap-1 text-xs text-slate-500">
                  <component :is="categoryConfig[item.category].icon" class="w-3.5 h-3.5" />
                  <span>{{ isAr ? categoryConfig[item.category].labelAr : categoryConfig[item.category].label }}</span>
                </div>

                <!-- Time -->
                <div v-if="item.sentAt || item.scheduledAt" class="flex items-center gap-1 text-xs text-slate-400">
                  <Clock class="w-3.5 h-3.5" />
                  <span>{{ item.sentAt ?? item.scheduledAt }}</span>
                </div>

                <!-- Read Rate (only for sent) -->
                <div v-if="item.status === 'sent' && item.reach > 0" class="flex items-center gap-2 flex-wrap sm:ms-auto">
                  <div class="flex items-center gap-1 text-xs text-slate-500">
                    <CheckCheck class="w-3.5 h-3.5 text-emerald-500" />
                    <span class="font-semibold text-slate-700">{{ readRate(item) }}%</span>
                    <span class="text-slate-400">{{ isAr ? 'معدل القراءة' : 'read rate' }}</span>
                  </div>
                  <span class="text-xs text-slate-400">·</span>
                  <span class="text-xs text-slate-500">
                    <span class="font-semibold text-slate-700">{{ item.reach.toLocaleString() }}</span>
                    {{ isAr ? ' وصل' : ' reached' }}
                  </span>
                </div>
              </div>

              <!-- Read Rate Bar (only for sent) -->
              <div v-if="item.status === 'sent' && item.reach > 0" class="mt-2.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  :style="{ width: readRate(item) + '%' }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ── Create Notification Modal ──────────────────────────────────────── -->
    <div
      v-if="isCreateModalOpen"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      @click.self="isCreateModalOpen = false"
    >
      <div class="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Bell class="w-4 h-4 text-emerald-600" />
            </div>
            <h3 class="text-sm font-black text-slate-900">{{ isAr ? 'إنشاء إشعار جديد' : 'New Notification' }}</h3>
          </div>
          <button
            type="button"
            @click="isCreateModalOpen = false"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-all"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

          <!-- Title EN -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">
              {{ isAr ? 'عنوان الإشعار (EN) *' : 'Notification Title (EN) *' }}
            </label>
            <input
              v-model="newNotif.title"
              type="text"
              :placeholder="isAr ? 'عنوان الإشعار بالإنجليزية' : 'e.g. Breaking: Market Update'"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:bg-white transition-all"
            />
          </div>

          <!-- Title AR -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">
              {{ isAr ? 'عنوان الإشعار (AR)' : 'Notification Title (AR)' }}
            </label>
            <input
              v-model="newNotif.titleAr"
              type="text"
              dir="rtl"
              :placeholder="isAr ? 'عنوان الإشعار بالعربية' : 'e.g. عاجل: تحديث السوق'"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:bg-white transition-all"
            />
          </div>

          <!-- Body EN -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">
              {{ isAr ? 'نص الإشعار (EN) *' : 'Notification Body (EN) *' }}
            </label>
            <textarea
              v-model="newNotif.body"
              rows="2"
              :placeholder="isAr ? 'نص الإشعار بالإنجليزية' : 'Short notification message...'"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:bg-white transition-all resize-none"
            />
          </div>

          <!-- Body AR -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">
              {{ isAr ? 'نص الإشعار (AR)' : 'Notification Body (AR)' }}
            </label>
            <textarea
              v-model="newNotif.bodyAr"
              rows="2"
              dir="rtl"
              :placeholder="isAr ? 'نص الإشعار بالعربية' : 'رسالة إشعار قصيرة...'"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:bg-white transition-all resize-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Category -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'التصنيف' : 'Category' }}</label>
              <select
                v-model="newNotif.category"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="news">{{ isAr ? 'أخبار' : 'News' }}</option>
                <option value="article">{{ isAr ? 'مقال' : 'Article' }}</option>
                <option value="video">{{ isAr ? 'فيديو' : 'Video' }}</option>
                <option value="promo">{{ isAr ? 'عرض ترويجي' : 'Promo' }}</option>
                <option value="system">{{ isAr ? 'نظام' : 'System' }}</option>
              </select>
            </div>

            <!-- Target -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'الجمهور المستهدف' : 'Target Audience' }}</label>
              <select
                v-model="newNotif.target"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="all">{{ isAr ? 'الجميع' : 'All Users' }}</option>
                <option value="free">{{ isAr ? 'المجانيين' : 'Free Users' }}</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          </div>

          <!-- Schedule Type -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-slate-700">{{ isAr ? 'وقت الإرسال' : 'Send Timing' }}</label>
            <div class="flex gap-2">
              <button
                type="button"
                @click="newNotif.scheduleType = 'now'"
                :class="['flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer', newNotif.scheduleType === 'now' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50']"
              >
                <Send class="w-3.5 h-3.5 inline me-1.5" />
                {{ isAr ? 'الآن' : 'Send Now' }}
              </button>
              <button
                type="button"
                @click="newNotif.scheduleType = 'later'"
                :class="['flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer', newNotif.scheduleType === 'later' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50']"
              >
                <Clock class="w-3.5 h-3.5 inline me-1.5" />
                {{ isAr ? 'جدولة' : 'Schedule' }}
              </button>
            </div>
            <input
              v-if="newNotif.scheduleType === 'later'"
              v-model="newNotif.scheduledAt"
              type="datetime-local"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            @click="isCreateModalOpen = false"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all text-center"
          >
            {{ isAr ? 'إلغاء' : 'Cancel' }}
          </button>
          <button
            type="button"
            @click="handleCreate"
            :class="['w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center gap-1.5', newNotif.scheduleType === 'now' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white']"
          >
            <Send class="w-3.5 h-3.5 inline" />
            <span>{{ newNotif.scheduleType === 'now' ? (isAr ? 'إرسال الآن' : 'Send Now') : (isAr ? 'جدولة الإشعار' : 'Schedule') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Preview Modal ───────────────────────────────────────────────────── -->
    <div
      v-if="isPreviewModalOpen && previewingItem"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      @click.self="isPreviewModalOpen = false"
    >
      <div class="bg-white rounded-3xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 class="text-sm font-black text-slate-900">{{ isAr ? 'معاينة الإشعار' : 'Notification Preview' }}</h3>
          <button
            type="button"
            @click="isPreviewModalOpen = false"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-6 flex flex-col gap-5">
          <!-- Phone mockup notification -->
          <div class="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center">
                <Bell class="w-3 h-3 text-white" />
              </div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">FinWise</span>
              <span class="text-xs text-slate-500 ms-auto">now</span>
            </div>
            <div>
              <p class="text-sm font-bold text-white">{{ isAr ? previewingItem.titleAr : previewingItem.title }}</p>
              <p class="text-xs text-slate-400 mt-1 leading-relaxed">{{ isAr ? previewingItem.bodyAr : previewingItem.body }}</p>
            </div>
          </div>

          <!-- Details -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-slate-50 rounded-xl p-3">
              <p class="text-xs text-slate-500 mb-1">{{ isAr ? 'الحالة' : 'Status' }}</p>
              <span :class="['text-xs font-black px-2 py-0.5 rounded-md border', statusConfig[previewingItem.status].class]">
                {{ isAr ? statusConfig[previewingItem.status].labelAr : statusConfig[previewingItem.status].label }}
              </span>
            </div>
            <div class="bg-slate-50 rounded-xl p-3">
              <p class="text-xs text-slate-500 mb-1">{{ isAr ? 'الجمهور' : 'Audience' }}</p>
              <p class="text-xs font-bold text-slate-800">{{ isAr ? targetConfig[previewingItem.target].labelAr : targetConfig[previewingItem.target].label }}</p>
            </div>
            <div v-if="previewingItem.reach > 0" class="bg-slate-50 rounded-xl p-3">
              <p class="text-xs text-slate-500 mb-1">{{ isAr ? 'الوصول' : 'Reach' }}</p>
              <p class="text-xs font-bold text-slate-800">{{ previewingItem.reach.toLocaleString() }}</p>
            </div>
            <div v-if="previewingItem.reach > 0" class="bg-slate-50 rounded-xl p-3">
              <p class="text-xs text-slate-500 mb-1">{{ isAr ? 'معدل القراءة' : 'Read Rate' }}</p>
              <p class="text-xs font-bold text-emerald-600">{{ readRate(previewingItem) }}%</p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            @click="isPreviewModalOpen = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
          >
            {{ isAr ? 'إغلاق' : 'Close' }}
          </button>
          <button
            v-if="previewingItem.status === 'draft' || previewingItem.status === 'failed'"
            type="button"
            @click="handleSend(previewingItem!); isPreviewModalOpen = false"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Send class="w-3.5 h-3.5 inline me-1.5" />
            {{ isAr ? 'إرسال الآن' : 'Send Now' }}
          </button>
        </div>
      </div>
    </div>

  </AppShell>
</template>
