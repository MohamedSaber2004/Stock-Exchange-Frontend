<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Shield, CreditCard } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const user = ref({
  id: route.params.id || 'usr-1',
  name: 'Ahmed Mohamed',
  email: 'ahmed@example.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  currentPlan: 'Pro',
  planStatus: 'Active',
  registeredDate: 'Sep 28, 2025',
  expirationDate: '2026-10-28',
  accountActive: true
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
      <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs flex items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-4">
          <img
            :src="user.avatar"
            :alt="user.name"
            class="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/20"
          />
          <div class="flex flex-col">
            <h1 class="text-lg font-black text-slate-900 tracking-tight">{{ user.name }}</h1>
            <span class="text-xs text-slate-500 font-medium">{{ user.email }}</span>
            <div class="flex items-center gap-2 mt-2">
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
              Account Status
            </div>

            <div class="flex flex-col gap-1.5 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <span class="text-[11px] font-bold text-slate-400 uppercase">Registration Date</span>
              <span class="text-xs font-bold text-slate-800">{{ user.registeredDate }}</span>
            </div>

            <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-100">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-slate-800">Account Access</span>
                <span class="text-[11px] text-slate-400">Allow user to log in and access content</span>
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
              Subscription
            </div>

            <!-- Current Plan Select -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">Current Plan</label>
              <select
                v-model="user.currentPlan"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
              >
                <option value="Free">Free</option>
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
              </select>
            </div>

            <!-- Expiration Date -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">Expiration Date</label>
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
      <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          @click="router.push('/users')"
          class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSave"
          class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
        >
          Save Changes
        </button>
      </div>
    </div>
  </AppShell>
</template>
