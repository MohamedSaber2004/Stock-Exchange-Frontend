<script setup lang="ts">
import { 
  LayoutDashboard, 
  FileText, 
  Video, 
  Newspaper, 
  Users, 
  Globe,
  ShieldCheck, 
  Shield, 
  HelpCircle,
  Info, 
  Settings, 
  LogOut,
  TrendingUp,
  Activity,
  Bell,
  Tags,
  X,
  type LucideIcon
} from 'lucide-vue-next'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { watch, computed } from 'vue'
import { useFeedback } from '@/composables/useFeedback'
import { useSidebar } from '@/composables/useSidebar'
import { coreServices } from '@/di'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { isOpen, close } = useSidebar()
const { confirm, toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

// Auto close sidebar on route change on mobile
watch(() => route.path, () => {
  close()
})

interface NavSection {
  title?: string
  items: {
    id: string
    label: string
    to: string
    icon: LucideIcon
    badge?: string
  }[]
}

const navSections = computed<NavSection[]>(() => [
  {
    items: [
      { id: 'dashboard', label: t('nav.dashboard'), to: '/', icon: LayoutDashboard }
    ]
  },
  {
    title: t('nav.content'),
    items: [
      { id: 'articles', label: t('nav.articles'), to: '/articles', icon: FileText },
      { id: 'videos', label: t('nav.videos'), to: '/videos', icon: Video },
      { id: 'news', label: t('nav.news'), to: '/news', icon: Newspaper },
      { id: 'categories', label: t('nav.categories'), to: '/categories', icon: Tags }
    ]
  },
  {
    title: t('nav.usersAndRegions'),
    items: [
      { id: 'users', label: t('nav.users'), to: '/users', icon: Users },
      { id: 'countries', label: t('nav.countries'), to: '/countries', icon: Globe }
    ]
  },
  {
    title: t('nav.app'),
    items: [
      { id: 'notifications', label: t('nav.notifications'), to: '/notifications', icon: Bell },
      { id: 'activity', label: t('nav.activity'), to: '/activity', icon: Activity },
      { id: 'help-center', label: t('nav.helpCenter'), to: '/help-center', icon: HelpCircle },
      { id: 'terms', label: t('nav.termsAndConditions'), to: '/terms', icon: ShieldCheck },
      { id: 'privacy', label: t('nav.privacyPolicy'), to: '/privacy', icon: Shield },
      { id: 'about', label: t('nav.about'), to: '/about', icon: Info }
    ]
  }
])

const isItemActive = (to: string) => {
  if (to === '/') {
    return route.path === '/'
  }
  if (to === '/terms') {
    return route.path === '/terms' && route.query.tab !== 'privacy'
  }
  if (to === '/privacy') {
    return route.path === '/privacy' || (route.path === '/terms' && route.query.tab === 'privacy')
  }
  return route.path.startsWith(to)
}

const handleLogout = async () => {
  const confirmed = await confirm({
    title: t('common.logout'),
    message: t('common.logoutConfirm'),
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
    close()
    router.push('/login')
  }
}

</script>

<template>
  <!-- Mobile Backdrop Overlay -->
  <Transition
    enter-active-class="transition-opacity duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      @click="close"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
      aria-hidden="true"
    />
  </Transition>

  <!-- Sidebar Container -->
  <aside
    :class="[
      'fixed lg:static top-0 start-0 h-full w-64 border-e border-slate-200/80 bg-white flex flex-col justify-between shrink-0 select-none z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:rtl:translate-x-0 lg:transform-none',
      isOpen 
        ? 'translate-x-0 shadow-2xl lg:shadow-none' 
        : (isAr ? 'max-lg:translate-x-full' : 'max-lg:-translate-x-full')
    ]"
    aria-label="Main Navigation"
  >
    <!-- Top: Brand Header (Fixed, no shrink) -->
    <div class="h-16 flex items-center justify-between px-5 sm:px-6 border-b border-slate-100 shrink-0 bg-white">
      <RouterLink to="/" class="flex items-center gap-2.5 group" @click="close">
        <div class="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/25 group-hover:scale-105 transition-transform">
          <TrendingUp class="w-4 h-4 stroke-[2.5]" />
        </div>
        <div class="flex items-center text-slate-900">
          <span class="font-black text-lg tracking-tight">Fin</span>
          <span class="font-black text-lg tracking-tight text-emerald-600">Wise</span>
        </div>
      </RouterLink>

      <!-- Mobile Close Button -->
      <button
        type="button"
        @click="close"
        class="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Close Navigation"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Middle: Navigation Links (Scrollable area) -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-3.5 flex flex-col gap-4">
      <div v-for="(section, sIdx) in navSections" :key="sIdx" class="flex flex-col gap-1">
        <div 
          v-if="section.title" 
          class="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase"
        >
          {{ section.title }}
        </div>

        <RouterLink
          v-for="item in section.items"
          :key="item.id"
          :to="item.to"
          @click="close"
          :class="[
            'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group',
            isItemActive(item.to)
              ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          ]"
        >
          <div class="flex items-center gap-3 min-w-0">
            <component
              :is="item.icon"
              :class="[
                'w-4 h-4 shrink-0 transition-colors',
                isItemActive(item.to) ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
              ]"
            />
            <span class="truncate">{{ item.label }}</span>
          </div>

          <span
            v-if="item.badge"
            class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0"
          >
            {{ item.badge }}
          </span>
        </RouterLink>
      </div>
    </div>

    <!-- Bottom: Settings & Logout (Fixed, no shrink) -->
    <div class="p-3 sm:p-3.5 border-t border-slate-100 flex flex-col gap-1 bg-white shrink-0">
      <RouterLink
        to="/settings"
        @click="close"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group',
          route.path.startsWith('/settings')
            ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        ]"
      >
        <Settings
          :class="[
            'w-4 h-4 shrink-0 transition-colors',
            route.path.startsWith('/settings') ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
          ]"
        />
        <span class="truncate">{{ t('nav.settings') }}</span>
      </RouterLink>

      <button
        type="button"
        @click="handleLogout"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer w-full text-start group"
      >
        <LogOut class="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors shrink-0" />
        <span class="truncate">{{ t('nav.logout') }}</span>
      </button>
    </div>
  </aside>
</template>
