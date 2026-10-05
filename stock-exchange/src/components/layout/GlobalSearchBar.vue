<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Search,
  X,
  Loader2,
  FileText,
  Video,
  Newspaper,
  Users,
  Briefcase,
  Award,
  Globe,
  HelpCircle,
  Compass,
  ChevronRight,
  Clock,
  ArrowUpRight,
  Trash2,
  CornerDownLeft
} from 'lucide-vue-next'
import { coreServices } from '@/di'
import type { GlobalSearchItem, SearchItemType } from '@/domain/models/search.model'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'

const router = useRouter()
const { t, locale } = useI18n()

const isAr = computed(() => locale.value === 'ar')

const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
const shortcutKey = isMac ? '⌘K' : 'Ctrl+K'

const query = ref('')
const isOpen = ref(false)
const isLoading = ref(false)
const selectedCategory = ref<string>('all')
const activeIndex = ref<number>(-1)

const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const listContainerRef = ref<HTMLElement | null>(null)

// API Results
const apiItems = ref<GlobalSearchItem[]>([])
const searchError = ref<string | null>(null)

// Recent searches stored in localStorage
const RECENT_SEARCHES_KEY = 'finwise_recent_searches'
const recentSearches = ref<string[]>([])

const loadRecentSearches = () => {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        recentSearches.value = parsed.slice(0, 6)
      }
    }
  } catch {
    recentSearches.value = []
  }
}

const saveRecentSearch = (term: string) => {
  const clean = term.trim()
  if (!clean || clean.length < 2) return
  const existing = recentSearches.value.filter((s) => s.toLowerCase() !== clean.toLowerCase())
  recentSearches.value = [clean, ...existing].slice(0, 6)
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches.value))
  } catch {
    // Ignore storage errors
  }
}

const clearRecentSearches = () => {
  recentSearches.value = []
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch {
    // Ignore storage errors
  }
}

const removeRecentSearch = (term: string) => {
  recentSearches.value = recentSearches.value.filter((s) => s !== term)
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches.value))
  } catch {
    // Ignore storage errors
  }
}

// Navigation Pages (Spotlight / Quick Navigation)
const adminPages = [
  { titleEn: 'Dashboard Overview', titleAr: 'لوحة التحكم العامة', path: '/', icon: Compass, badgeEn: 'Overview', badgeAr: 'نظرة عامة' },
  { titleEn: 'Articles Management', titleAr: 'إدارة المقالات', path: '/articles', icon: FileText, badgeEn: 'Content', badgeAr: 'محتوى' },
  { titleEn: 'Create Article', titleAr: 'إنشاء مقال جديد', path: '/articles/create', icon: FileText, badgeEn: 'Action', badgeAr: 'إجراء' },
  { titleEn: 'Videos Management', titleAr: 'إدارة الفيديوهات', path: '/videos', icon: Video, badgeEn: 'Media', badgeAr: 'وسائط' },
  { titleEn: 'Add Video', titleAr: 'إضافة فيديو جديد', path: '/videos/create', icon: Video, badgeEn: 'Action', badgeAr: 'إجراء' },
  { titleEn: 'Market News', titleAr: 'أخبار السوق المالية', path: '/news', icon: Newspaper, badgeEn: 'News', badgeAr: 'أخبار' },
  { titleEn: 'Post News', titleAr: 'نشر خبر جديد', path: '/news/create', icon: Newspaper, badgeEn: 'Action', badgeAr: 'إجراء' },
  { titleEn: 'Categories Management', titleAr: 'إدارة التصنيفات', path: '/categories', icon: Compass, badgeEn: 'Taxonomy', badgeAr: 'تصنيفات' },
  { titleEn: 'Services Management', titleAr: 'إدارة الخدمات المالية', path: '/services', icon: Briefcase, badgeEn: 'Services', badgeAr: 'خدمات' },
  { titleEn: 'Our Experts', titleAr: 'فريق الخبراء والمحللين', path: '/experts', icon: Award, badgeEn: 'Team', badgeAr: 'فريق' },
  { titleEn: 'Users Management', titleAr: 'إدارة المستخدمين', path: '/users', icon: Users, badgeEn: 'Users', badgeAr: 'مستخدمون' },
  { titleEn: 'Countries & Markets', titleAr: 'إدارة الدول والأسواق', path: '/countries', icon: Globe, badgeEn: 'System', badgeAr: 'نظام' },
  { titleEn: 'Activity Log & Audits', titleAr: 'سجل النشاطات والمراقبة', path: '/activity', icon: Clock, badgeEn: 'Audit', badgeAr: 'تدقيق' },
  { titleEn: 'Help Center & FAQ', titleAr: 'مركز المساعدة والأسئلة الشائعة', path: '/help-center', icon: HelpCircle, badgeEn: 'Support', badgeAr: 'دعم' },
  { titleEn: 'Terms & Conditions', titleAr: 'الشروط والأحكام', path: '/terms', icon: FileText, badgeEn: 'Legal', badgeAr: 'قانوني' },
  { titleEn: 'Privacy Policy', titleAr: 'سياسة الخصوصية', path: '/privacy', icon: FileText, badgeEn: 'Legal', badgeAr: 'قانوني' },
  { titleEn: 'About FinWise', titleAr: 'عن منصة FinWise', path: '/about', icon: Compass, badgeEn: 'About', badgeAr: 'عن المنصة' },
  { titleEn: 'Admin Profile & Settings', titleAr: 'الملف الشخصي والإعدادات', path: '/settings', icon: Users, badgeEn: 'Account', badgeAr: 'حساب' },
  { titleEn: 'System Notifications', titleAr: 'الإشعارات والتنبيهات', path: '/notifications', icon: Compass, badgeEn: 'Alerts', badgeAr: 'تنبيهات' },
]

const matchedPages = computed<GlobalSearchItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) {
    // Show top quick links when query is empty
    return adminPages.slice(0, 4).map((p) => ({
      id: p.path,
      title: isAr.value ? p.titleAr : p.titleEn,
      subtitle: p.path,
      type: 'page' as SearchItemType,
      targetRoute: p.path,
      badge: isAr.value ? p.badgeAr : p.badgeEn,
    }))
  }

  return adminPages
    .filter(
      (p) =>
        p.titleEn.toLowerCase().includes(q) ||
        p.titleAr.toLowerCase().includes(q) ||
        p.path.toLowerCase().includes(q) ||
        p.badgeEn.toLowerCase().includes(q) ||
        p.badgeAr.toLowerCase().includes(q)
    )
    .map((p) => ({
      id: p.path,
      title: isAr.value ? p.titleAr : p.titleEn,
      subtitle: p.path,
      type: 'page' as SearchItemType,
      targetRoute: p.path,
      badge: isAr.value ? p.badgeAr : p.badgeEn,
    }))
})

// Filtered items based on category tabs
const displayedItems = computed<GlobalSearchItem[]>(() => {
  const combined: GlobalSearchItem[] = []

  // Add matching pages first if relevant or when in 'all' / 'page' tab
  if (selectedCategory.value === 'all' || selectedCategory.value === 'page') {
    combined.push(...matchedPages.value)
  }

  if (selectedCategory.value === 'all') {
    combined.push(...apiItems.value)
  } else if (selectedCategory.value !== 'page') {
    combined.push(...apiItems.value.filter((item) => item.type === selectedCategory.value))
  }

  return combined
})

// Counts per category tab
const counts = computed<Record<string, number>>(() => {
  const c: Record<string, number> = {
    all: apiItems.value.length + matchedPages.value.length,
    page: matchedPages.value.length,
    article: 0,
    video: 0,
    news: 0,
    user: 0,
    service: 0,
    expert: 0,
    country: 0,
    help: 0,
  }

  for (const item of apiItems.value) {
    c[item.type] = (c[item.type] ?? 0) + 1
  }

  return c
})

const availableCategories = computed(() => {
  const list = [
    { key: 'all', label: t('search.all'), count: counts.value.all ?? 0 },
    { key: 'page', label: t('search.pages'), count: counts.value.page ?? 0 },
    { key: 'article', label: t('search.articles'), count: counts.value.article ?? 0 },
    { key: 'video', label: t('search.videos'), count: counts.value.video ?? 0 },
    { key: 'news', label: t('search.news'), count: counts.value.news ?? 0 },
    { key: 'user', label: t('search.users'), count: counts.value.user ?? 0 },
    { key: 'service', label: t('search.services'), count: counts.value.service ?? 0 },
    { key: 'expert', label: t('search.experts'), count: counts.value.expert ?? 0 },
    { key: 'country', label: t('search.countries'), count: counts.value.country ?? 0 },
    { key: 'help', label: t('search.helpCenter'), count: counts.value.help ?? 0 },
  ]
  // Only show categories that have results or if query is empty
  return list.filter((cat) => cat.key === 'all' || cat.count > 0)
})

// Debounced backend search
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const performSearch = async (term: string) => {
  const clean = term.trim()
  if (clean.length < 2) {
    apiItems.value = []
    isLoading.value = false
    searchError.value = null
    return
  }

  isLoading.value = true
  searchError.value = null

  try {
    const result = await coreServices.search.search(clean, 6)
    apiItems.value = result.items || []
  } catch (err: unknown) {
    console.error('Global search error:', err)
    searchError.value = isAr.value ? 'حدث خطأ أثناء البحث، يرجى المحاولة لاحقاً' : 'Error searching, please try again'
    apiItems.value = []
  } finally {
    isLoading.value = false
  }
}

watch(query, (newVal) => {
  activeIndex.value = -1
  if (debounceTimer) clearTimeout(debounceTimer)

  const clean = newVal.trim()
  if (clean.length < 2) {
    apiItems.value = []
    isLoading.value = false
    return
  }

  isLoading.value = true
  debounceTimer = setTimeout(() => {
    performSearch(clean)
  }, 250)
})

// Actions
const openDropdown = () => {
  isOpen.value = true
  loadRecentSearches()
}

const closeDropdown = () => {
  isOpen.value = false
  activeIndex.value = -1
}

const clearQuery = () => {
  query.value = ''
  apiItems.value = []
  activeIndex.value = -1
  inputRef.value?.focus()
}

const selectItem = (item: GlobalSearchItem) => {
  if (query.value.trim()) {
    saveRecentSearch(query.value)
  }
  closeDropdown()
  if (item.targetRoute) {
    router.push(item.targetRoute)
  }
}

const applyRecentSearch = (term: string) => {
  query.value = term
  inputRef.value?.focus()
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      openDropdown()
      inputRef.value?.focus()
    }
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    closeDropdown()
    inputRef.value?.blur()
    return
  }

  const items = displayedItems.value
  if (!items.length) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % items.length
    scrollActiveIntoView()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + items.length) % items.length
    scrollActiveIntoView()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (activeIndex.value >= 0 && activeIndex.value < items.length) {
      const targetItem = items[activeIndex.value]
      if (targetItem) {
        selectItem(targetItem)
      }
    }
  }
}

const scrollActiveIntoView = () => {
  nextTick(() => {
    if (!listContainerRef.value) return
    const activeEl = listContainerRef.value.querySelector('[data-active="true"]') as HTMLElement | null
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  })
}

// Click outside handling
const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('keydown', handleKeydown)
  loadRecentSearches()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('keydown', handleKeydown)
  if (debounceTimer) clearTimeout(debounceTimer)
})

// Visual Helpers
const getItemIcon = (type: SearchItemType) => {
  switch (type) {
    case 'article':
      return FileText
    case 'video':
      return Video
    case 'news':
      return Newspaper
    case 'user':
      return Users
    case 'service':
      return Briefcase
    case 'expert':
      return Award
    case 'country':
      return Globe
    case 'help':
      return HelpCircle
    case 'page':
    default:
      return Compass
  }
}

const getItemColor = (type: SearchItemType) => {
  switch (type) {
    case 'article':
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        iconBg: 'bg-emerald-50 text-emerald-600',
      }
    case 'video':
      return {
        badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
        iconBg: 'bg-purple-50 text-purple-600',
      }
    case 'news':
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
        iconBg: 'bg-amber-50 text-amber-600',
      }
    case 'user':
      return {
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        iconBg: 'bg-indigo-50 text-indigo-600',
      }
    case 'service':
      return {
        badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
        iconBg: 'bg-blue-50 text-blue-600',
      }
    case 'expert':
      return {
        badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
        iconBg: 'bg-rose-50 text-rose-600',
      }
    case 'country':
      return {
        badge: 'bg-teal-50 text-teal-700 border-teal-200/80',
        iconBg: 'bg-teal-50 text-teal-600',
      }
    case 'help':
      return {
        badge: 'bg-sky-50 text-sky-700 border-sky-200/80',
        iconBg: 'bg-sky-50 text-sky-600',
      }
    case 'page':
    default:
      return {
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        iconBg: 'bg-slate-100 text-slate-600',
      }
  }
}
</script>

<template>
  <div class="relative w-full max-w-[145px] xs:max-w-[185px] sm:max-w-xs md:max-w-md" ref="containerRef">
    <!-- Search Bar Input Wrapper -->
    <div
      class="relative flex items-center w-full transition-all duration-200"
      :class="{ 'ring-2 ring-emerald-500/20 rounded-xl shadow-xs': isOpen }"
    >
      <Search
        v-if="!isLoading"
        class="w-4 h-4 text-slate-400 absolute start-3 sm:start-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
        :class="{ 'text-emerald-600': isOpen }"
      />
      <Loader2
        v-else
        class="w-4 h-4 text-emerald-600 animate-spin absolute start-3 sm:start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
      />

      <input
        ref="inputRef"
        type="text"
        v-model="query"
        @focus="openDropdown"
        :placeholder="t('search.placeholder')"
        class="w-full bg-slate-50/90 hover:bg-slate-100/70 border border-slate-200 rounded-xl ps-8 sm:ps-10 pe-14 sm:pe-16 py-1.5 sm:py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all truncate"
        autocomplete="off"
        spellcheck="false"
      />

      <!-- Right Controls inside input (Clear + Shortcut Badge) -->
      <div class="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <button
          v-if="query"
          type="button"
          @click="clearQuery"
          class="p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          title="Clear search"
          aria-label="Clear search"
        >
          <X class="w-3.5 h-3.5" />
        </button>

        <span
          class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200/80 rounded-md select-none pointer-events-none"
        >
          {{ shortcutKey }}
        </span>
      </div>
    </div>

    <!-- Dropdown / Command Center Popover -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-2"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-2"
    >
      <div
        v-if="isOpen"
        class="fixed inset-x-3 top-[4.25rem] sm:absolute sm:inset-auto sm:top-full sm:mt-2 sm:start-0 sm:w-[500px] md:w-[560px] max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[82vh] backdrop-blur-md"
      >
        <!-- Category Filter Tabs -->
        <div
          v-if="query.trim().length >= 2 && availableCategories.length > 2"
          class="flex items-center gap-1.5 px-3 py-2 bg-slate-50/90 border-b border-slate-100 overflow-x-auto no-scrollbar shrink-0"
        >
          <button
            v-for="cat in availableCategories"
            :key="cat.key"
            type="button"
            @click="selectedCategory = cat.key"
            class="px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            :class="[
              selectedCategory === cat.key
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            ]"
          >
            <span>{{ cat.label }}</span>
            <span
              class="text-[10px] px-1 py-0.2 rounded-full font-bold"
              :class="selectedCategory === cat.key ? 'bg-emerald-700/80 text-white' : 'bg-slate-200/70 text-slate-500'"
            >
              {{ cat.count }}
            </span>
          </button>
        </div>

        <!-- Scrollable Results Container -->
        <div ref="listContainerRef" class="overflow-y-auto flex-1 p-2 divide-y divide-slate-100 overscroll-contain">
          <!-- State: Recent Searches (when query is empty) -->
          <div v-if="!query.trim()" class="p-2 space-y-4">
            <!-- Recent searches chips -->
            <div v-if="recentSearches.length > 0" class="space-y-2">
              <div class="flex items-center justify-between px-1">
                <span class="text-[11px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5 text-slate-400" />
                  {{ t('search.recentSearches') }}
                </span>
                <button
                  type="button"
                  @click="clearRecentSearches"
                  class="text-[11px] font-medium text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 class="w-3 h-3" />
                  {{ t('search.clearRecent') }}
                </button>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <div
                  v-for="recent in recentSearches"
                  :key="recent"
                  class="group flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs transition-colors cursor-pointer"
                  @click="applyRecentSearch(recent)"
                >
                  <span>{{ recent }}</span>
                  <button
                    type="button"
                    @click.stop="removeRecentSearch(recent)"
                    class="opacity-40 group-hover:opacity-100 hover:text-rose-600 transition-opacity p-0.5"
                    title="Remove"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Quick Navigation Pages -->
            <div class="space-y-1.5 pt-1">
              <span class="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-1 flex items-center gap-1.5">
                <Compass class="w-3.5 h-3.5 text-slate-400" />
                {{ t('search.quickPages') }}
              </span>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1">
                <button
                  v-for="page in adminPages.slice(0, 6)"
                  :key="page.path"
                  type="button"
                  @click="selectItem({
                    id: page.path,
                    title: isAr ? page.titleAr : page.titleEn,
                    type: 'page',
                    targetRoute: page.path
                  })"
                  class="flex items-center justify-between p-2 rounded-xl text-start hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group cursor-pointer"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <component :is="page.icon" class="w-4 h-4" />
                    </div>
                    <span class="text-xs font-semibold text-slate-700 group-hover:text-emerald-700 truncate">
                      {{ isAr ? page.titleAr : page.titleEn }}
                    </span>
                  </div>
                  <ChevronRight class="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 rtl:rotate-180 shrink-0 transition-colors" />
                </button>
              </div>
            </div>
          </div>

          <!-- State: Loading skeleton / spinner -->
          <div v-else-if="isLoading" class="p-8 text-center space-y-2">
            <Loader2 class="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
            <p class="text-xs font-medium text-slate-500">{{ t('search.searching') }}</p>
          </div>

          <!-- State: Error message -->
          <div v-else-if="searchError" class="p-6 text-center text-xs text-rose-600">
            {{ searchError }}
          </div>

          <!-- State: No Results -->
          <div
            v-else-if="displayedItems.length === 0"
            class="p-8 text-center space-y-2"
          >
            <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search class="w-6 h-6" />
            </div>
            <h4 class="text-sm font-bold text-slate-700">{{ t('search.noResults') }}</h4>
            <p class="text-xs text-slate-400 max-w-xs mx-auto">
              {{ t('search.noResultsDesc', { query }) }}
            </p>
          </div>

          <!-- State: Results List -->
          <div v-else class="space-y-1">
            <div
              v-for="(item, idx) in displayedItems"
              :key="item.id + item.type + idx"
              :data-active="activeIndex === idx"
              @click="selectItem(item)"
              @mouseenter="activeIndex = idx"
              class="flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer group select-none"
              :class="[
                activeIndex === idx
                  ? 'bg-emerald-50/70 border-emerald-200/60 shadow-2xs'
                  : 'hover:bg-slate-50 border-transparent'
              ]"
            >
              <!-- Left: Image/Icon + Info -->
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <!-- Thumbnail / Avatar or Category Icon -->
                <div class="relative shrink-0">
                  <img
                    v-if="item.imageUrl"
                    :src="resolveAttachmentUrl(item.imageUrl, item.type === 'user' ? 'avatar' : 'image')"
                    @error="handleImageError($event, item.type === 'user' ? 'avatar' : 'image')"
                    :alt="item.title"
                    class="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                    :class="getItemColor(item.type).iconBg"
                  >
                    <component :is="getItemIcon(item.type)" class="w-5 h-5" />
                  </div>
                </div>

                <!-- Title & Subtitle -->
                <div class="flex flex-col min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate"
                      :class="{ 'text-emerald-700': activeIndex === idx }"
                    >
                      {{ item.title }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2 text-[11px] text-slate-400 truncate mt-0.5">
                    <span v-if="item.subtitle" class="truncate font-medium text-slate-500">
                      {{ item.subtitle }}
                    </span>
                    <span v-if="item.subtitle && item.category" class="text-slate-300">•</span>
                    <span v-if="item.category" class="truncate">
                      {{ item.category }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Right: Type Badge & Action Hint -->
              <div class="flex items-center gap-2 shrink-0 ms-2">
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                  :class="getItemColor(item.type).badge"
                >
                  {{ item.badge || item.type }}
                </span>

                <ArrowUpRight
                  class="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors rtl:rotate-[-90deg]"
                  :class="{ 'text-emerald-600': activeIndex === idx }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer / Shortcut Hint -->
        <div class="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1">
              <CornerDownLeft class="w-3 h-3 text-slate-400" />
              <span>{{ isAr ? 'Enter للاختيار' : 'Enter to select' }}</span>
            </span>
            <span class="hidden sm:inline-flex items-center gap-1">
              <span class="px-1 py-0.2 bg-white rounded border border-slate-200 text-[10px] font-semibold text-slate-500">↑</span>
              <span class="px-1 py-0.2 bg-white rounded border border-slate-200 text-[10px] font-semibold text-slate-500">↓</span>
              <span>{{ isAr ? 'للتنقل' : 'to navigate' }}</span>
            </span>
          </div>

          <span class="flex items-center gap-1 text-slate-400">
            <span class="px-1 py-0.2 bg-white rounded border border-slate-200 text-[10px] font-semibold text-slate-500">ESC</span>
            <span>{{ isAr ? 'للإغلاق' : 'to close' }}</span>
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
