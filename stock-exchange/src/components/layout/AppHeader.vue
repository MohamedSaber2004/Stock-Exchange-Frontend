<script setup lang="ts">
import { Bell, ChevronRight, Menu, Globe, User, LogOut, ChevronDown, Check } from 'lucide-vue-next'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFeedback } from '@/composables/useFeedback'
import { useSidebar } from '@/composables/useSidebar'
import { useLocale } from '@/composables/useLocale'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import { resolveAttachmentUrl, handleImageError } from '@/utils/attachment'
import GlobalSearchBar from './GlobalSearchBar.vue'

const route = useRoute()
const router = useRouter()
const { toast, confirm } = useFeedback()
const { toggle, close: closeSidebar } = useSidebar()
const { t } = useI18n()
const { currentLocale, setLocale } = useLocale()

const isMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const isAr = computed(() => currentLocale.value === 'ar')

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    closeMenu()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})

const navigateToProfile = () => {
  closeMenu()
  router.push('/profile')
}

const selectLocale = (lang: 'ar' | 'en') => {
  setLocale(lang)
}

const currentUser = computed(() => coreServices.tokenStore.getUser())
const adminName = computed(() => currentUser.value?.fullName || currentUser.value?.name || 'Admin')
const adminEmail = computed(() => currentUser.value?.email || 'admin@finwise.com')
const adminAvatar = computed(() => {
  const pic = currentUser.value?.profilePictureUrl || currentUser.value?.avatarUrl
  return resolveAttachmentUrl(pic, 'avatar')
})

const handleLogout = async () => {
  closeMenu()
  const confirmed = await confirm({
    title: t('common.logout'),
    message: isAr.value
      ? 'هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة التحكم؟'
      : 'Are you sure you want to sign out from FinWise Admin?',
    confirmText: t('common.logout'),
    cancelText: t('common.cancel'),
    type: 'warning',
  })

  if (confirmed) {
    try {
      await coreServices.auth.logout()
    } catch {
      coreServices.tokenStore.clear()
    }
    toast.info(isAr.value ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully')
    closeSidebar()
    router.push('/login')
  }
}


// Dynamic breadcrumb based on route
const breadcrumbs = computed(() => {
  const path = route.path
  if (path === '/') return [{ label: t('nav.dashboard'), to: '/' }]
  
  const crumbs: { label: string; to?: string }[] = []
  
  if (path.startsWith('/articles')) {
    crumbs.push({ label: t('nav.articles'), to: '/articles' })
    if (path.includes('/create')) crumbs.push({ label: isAr.value ? 'إنشاء مقال' : 'Create Article' })
    else if (path.includes('/edit')) crumbs.push({ label: isAr.value ? 'تعديل المقال' : 'Edit Article' })
  } else if (path.startsWith('/videos')) {
    crumbs.push({ label: t('nav.videos'), to: '/videos' })
    if (path.includes('/create')) crumbs.push({ label: isAr.value ? 'إضافة فيديو' : 'Create Video' })
    else if (path.includes('/edit')) crumbs.push({ label: isAr.value ? 'تعديل الفيديو' : 'Edit Video' })
  } else if (path.startsWith('/news')) {
    crumbs.push({ label: t('nav.news'), to: '/news' })
    if (path.includes('/create')) crumbs.push({ label: isAr.value ? 'نشر خبر' : 'Post News' })
  } else if (path.startsWith('/users')) {
    crumbs.push({ label: t('nav.users'), to: '/users' })
    if (route.params.id) crumbs.push({ label: isAr.value ? 'تفاصيل المستخدم' : 'User Details' })
  } else if (path.startsWith('/countries')) {
    crumbs.push({ label: t('nav.countries'), to: '/countries' })
  } else if (path.startsWith('/terms')) {
    crumbs.push({ label: t('nav.terms'), to: '/terms' })
  } else if (path.startsWith('/about')) {
    crumbs.push({ label: t('nav.about'), to: '/about' })
  } else if (path.startsWith('/settings') || path.startsWith('/profile')) {
    crumbs.push({ label: t('common.profile'), to: '/profile' })
  } else if (path.startsWith('/activity')) {
    crumbs.push({ label: t('nav.activity'), to: '/activity' })
  } else if (path.startsWith('/notifications')) {
    crumbs.push({ label: t('nav.notifications'), to: '/notifications' })
  }
  
  return crumbs
})

const navigateToNotifications = () => {
  closeMenu()
  router.push('/notifications')
}
</script>

<template>
  <header class="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
    <!-- Left: Hamburger toggle (mobile) & Search Bar & Breadcrumbs -->
    <div class="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xl">
      <!-- Mobile Sidebar Toggle -->
      <button
        type="button"
        @click="toggle"
        class="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
        title="Open Navigation Menu"
        aria-label="Open Navigation Menu"
      >
        <Menu class="w-5 h-5" />
      </button>

      <!-- Global Search Bar with Autocomplete & Command Palette -->
      <GlobalSearchBar />

      <!-- Optional subtle breadcrumb on wide screens -->
      <div v-if="breadcrumbs.length > 1" class="hidden 2xl:flex items-center gap-1.5 text-xs text-slate-400">
        <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
          <ChevronRight v-if="idx > 0" class="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />
          <span :class="idx === breadcrumbs.length - 1 ? 'font-semibold text-slate-700' : 'text-slate-500'">
            {{ crumb.label }}
          </span>
        </template>
      </div>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
      <!-- Notifications -->
      <button
        type="button"
        @click="navigateToNotifications"
        class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all relative cursor-pointer shrink-0 ms-1 me-1 sm:ms-1.5 sm:me-1.5 md:ms-2 md:me-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-95 shadow-2xs"
        :title="t('nav.notifications')"
        :aria-label="t('nav.notifications')"
      >
        <Bell class="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        <span class="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white absolute top-1.5 end-1.5" />
      </button>

      <!-- Switcher & Profile Dropdown Container -->
      <div class="relative" ref="menuRef">
        <!-- Switcher Trigger Button -->
        <button
          type="button"
          @click="toggleMenu"
          class="flex items-center gap-2 sm:gap-2.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
          :aria-expanded="isMenuOpen"
          aria-haspopup="true"
        >
          <!-- Current Locale Badge -->
          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Globe class="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span class="tracking-wide uppercase">{{ currentLocale === 'ar' ? 'العربية' : 'EN' }}</span>
          </div>

          <span class="w-px h-4 bg-slate-200" />

          <!-- Admin Avatar & Name -->
          <div class="flex items-center gap-1.5">
            <img
              :src="adminAvatar"
              @error="handleImageError($event, 'avatar')"
              alt="Admin Avatar"
              class="w-6 h-6 rounded-full object-cover ring-2 ring-emerald-500/20"
            />
            <span class="hidden sm:inline text-xs font-bold text-slate-800">{{ adminName }}</span>
            <ChevronDown
              class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200"
              :class="{ 'rotate-180': isMenuOpen }"
            />
          </div>
        </button>

        <!-- Dropdown Menu -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="transform scale-95 opacity-0 -translate-y-1"
          enter-to-class="transform scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="transform scale-100 opacity-100 translate-y-0"
          leave-to-class="transform scale-95 opacity-0 -translate-y-1"
        >
          <div
            v-if="isMenuOpen"
            class="absolute end-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 overflow-hidden"
          >
            <!-- User Mini Profile Header -->
            <div class="p-3 bg-slate-50/80 rounded-xl mb-2 flex items-center gap-3 border border-slate-100">
              <img
                :src="adminAvatar"
                @error="handleImageError($event, 'avatar')"
                alt="Admin"
                class="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
              />
              <div class="flex flex-col min-w-0 flex-1">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-xs font-bold text-slate-900 truncate">{{ adminName }}</span>
                  <span class="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md border border-emerald-200">
                    {{ isAr ? 'المشرف' : 'Super Admin' }}
                  </span>
                </div>
                <span class="text-[11px] text-slate-500 truncate">{{ adminEmail }}</span>
              </div>
            </div>

            <!-- Profile Navigation -->
            <button
              type="button"
              @click="navigateToProfile"
              class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-xl transition-colors cursor-pointer group"
            >
              <div class="flex items-center gap-2.5">
                <User class="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                <span>{{ t('common.profile') }}</span>
              </div>
              <ChevronRight class="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 rtl:rotate-180 transition-colors" />
            </button>

            <!-- Language Switcher Section -->
            <div class="my-1.5 pt-1.5 border-t border-slate-100">
              <span class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {{ t('common.switchLanguage') }}
              </span>

              <div class="grid grid-cols-2 gap-1 px-1">
                <button
                  type="button"
                  @click="selectLocale('ar')"
                  :class="[
                    'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    currentLocale === 'ar'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  ]"
                >
                  <span>العربية</span>
                  <Check v-if="currentLocale === 'ar'" class="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  @click="selectLocale('en')"
                  :class="[
                    'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    currentLocale === 'en'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  ]"
                >
                  <span>English</span>
                  <Check v-if="currentLocale === 'en'" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Logout Button -->
            <div class="mt-1.5 pt-1.5 border-t border-slate-100">
              <button
                type="button"
                @click="handleLogout"
                class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer group"
              >
                <LogOut class="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                <span>{{ t('common.logout') }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

