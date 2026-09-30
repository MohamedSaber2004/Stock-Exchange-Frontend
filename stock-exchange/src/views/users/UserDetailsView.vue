<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Shield, CreditCard, ShieldCheck } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

interface UserDetail {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  roleKey: string
  currentPlan: string
  planStatus: string
  registeredDate: string
  expirationDate: string
  accountActive: boolean
}

const mockUsers: UserDetail[] = [
  {
    id: 'usr-1',
    name: 'Ahmed Mohamed',
    email: 'ahmed@example.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    role: 'Investor',
    roleKey: 'roleInvestor',
    currentPlan: 'Pro',
    planStatus: 'Active',
    registeredDate: 'Sep 28, 2025',
    expirationDate: '2026-10-28',
    accountActive: true
  },
  {
    id: 'usr-2',
    name: 'Sara Ali',
    email: 'sara@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    role: 'Trader',
    roleKey: 'roleTrader',
    currentPlan: 'Free',
    planStatus: 'Active',
    registeredDate: 'Sep 24, 2025',
    expirationDate: '2026-03-24',
    accountActive: true
  },
  {
    id: 'usr-3',
    name: 'Omar Tarek',
    email: 'omar@example.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    role: 'Analyst',
    roleKey: 'roleAnalyst',
    currentPlan: 'Pro',
    planStatus: 'Expired',
    registeredDate: 'Sep 20, 2025',
    expirationDate: '2025-09-20',
    accountActive: false
  },
  {
    id: 'usr-4',
    name: 'Sarah Hassan',
    email: 'sarah@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
    role: 'Member',
    roleKey: 'roleMember',
    currentPlan: 'Basic',
    planStatus: 'Active',
    registeredDate: 'Sep 15, 2025',
    expirationDate: '2026-09-15',
    accountActive: true
  },
  {
    id: 'usr-5',
    name: 'Ali Nasser',
    email: 'ali@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    role: 'Investor',
    roleKey: 'roleInvestor',
    currentPlan: 'Basic',
    planStatus: 'Active',
    registeredDate: 'Sep 10, 2025',
    expirationDate: '2026-09-10',
    accountActive: true
  }
]

const targetId = (route.params.id as string) || 'usr-1'
const foundUser = mockUsers.find(u => u.id === targetId)

const user = ref<UserDetail>({
  id: targetId,
  name: foundUser?.name || 'Ahmed Mohamed',
  email: foundUser?.email || 'ahmed@example.com',
  avatar: foundUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  role: foundUser?.role || 'Investor',
  roleKey: foundUser?.roleKey || 'roleInvestor',
  currentPlan: foundUser?.currentPlan || 'Pro',
  planStatus: foundUser?.planStatus || 'Active',
  registeredDate: foundUser?.registeredDate || 'Sep 28, 2025',
  expirationDate: foundUser?.expirationDate || '2026-10-28',
  accountActive: foundUser ? foundUser.accountActive : true
})

const updateRoleKey = () => {
  const map: Record<string, string> = {
    Investor: 'roleInvestor',
    Trader: 'roleTrader',
    Analyst: 'roleAnalyst',
    Member: 'roleMember'
  }
  user.value.roleKey = map[user.value.role] || 'roleMember'
}

const roleLabel = computed(() => {
  if (user.value.roleKey) {
    const key = `users.${user.value.roleKey}`
    const translated = t(key)
    if (translated && !translated.startsWith('users.')) {
      return translated
    }
  }
  return user.value.role
})

const handleSave = () => {
  toast.success(isAr.value ? 'تم حفظ بيانات المستخدم بنجاح' : 'User details saved successfully')
  router.push('/users')
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-4xl mx-auto">
      <!-- Back Button -->
      <button
        type="button"
        @click="router.push('/users')"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-4 transition-colors cursor-pointer w-fit"
      >
        <ArrowLeft class="w-3.5 h-3.5 rtl:rotate-180" />
        {{ t('common.back') }}
      </button>

      <!-- User Info Header Card -->
      <div class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-3.5 sm:gap-4">
          <img
            :src="user.avatar"
            :alt="user.name"
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-emerald-500/20 shrink-0"
          />
          <div class="flex flex-col">
            <h1 class="text-lg font-black text-slate-900 tracking-tight">{{ user.name }}</h1>
            <span class="text-xs text-slate-500 font-medium">{{ user.email }}</span>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <!-- Role Badge -->
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 font-bold text-xs">
                <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
                <span>{{ roleLabel }}</span>
              </span>
              <StatusBadge :status="user.currentPlan" variant="purple" />
              <StatusBadge :status="user.accountActive ? 'Active' : 'Suspended'" />
            </div>
          </div>
        </div>
      </div>

      <!-- Account & Subscription Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Account Status Card -->
        <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Shield class="w-4 h-4 text-emerald-600" />
              {{ isAr ? 'حالة الحساب والدور' : 'Account Status & Role' }}
            </div>

            <!-- Role Selector -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('users.roleCol') }}</label>
              <select
                v-model="user.role"
                @change="updateRoleKey"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
              >
                <option value="Investor">{{ t('users.roleInvestor') }}</option>
                <option value="Trader">{{ t('users.roleTrader') }}</option>
                <option value="Analyst">{{ t('users.roleAnalyst') }}</option>
                <option value="Member">{{ t('users.roleMember') }}</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <span class="text-[11px] font-bold text-slate-400 uppercase">{{ isAr ? 'تاريخ الانضمام' : 'Registration Date' }}</span>
              <span class="text-xs font-bold text-slate-800">{{ user.registeredDate }}</span>
            </div>

            <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-100">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-slate-800">{{ isAr ? 'صلاحية الدخول للحساب' : 'Account Access' }}</span>
                <span class="text-[11px] text-slate-400">{{ isAr ? 'السماح للمستخدم بتسجيل الدخول والوصول للمحتوى' : 'Allow user to log in and access content' }}</span>
              </div>
              <input
                type="checkbox"
                v-model="user.accountActive"
                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <!-- Subscription Card -->
        <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <CreditCard class="w-4 h-4 text-emerald-600" />
              {{ isAr ? 'معلومات الاشتراك' : 'Subscription' }}
            </div>

            <!-- Current Plan Select -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'الباقة الحالية' : 'Current Plan' }}</label>
              <select
                v-model="user.currentPlan"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
              >
                <option value="Free">{{ t('users.planFree') || 'Free' }}</option>
                <option value="Basic">{{ t('users.planBasic') || 'Basic' }}</option>
                <option value="Pro">{{ t('users.planPro') || 'Pro' }}</option>
              </select>
            </div>

            <!-- Expiration Date -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ isAr ? 'تاريخ انتهاء الاشتراك' : 'Expiration Date' }}</label>
              <div class="relative">
                <input
                  type="date"
                  v-model="user.expirationDate"
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer Actions -->
      <div class="mt-8 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
        <button
          type="button"
          @click="router.push('/users')"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer text-center"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          @click="handleSave"
          class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer text-center"
        >
          {{ t('common.save') }}
        </button>
      </div>
    </div>
  </AppShell>
</template>
